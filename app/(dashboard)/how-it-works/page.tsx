'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  data?: T[] | T | null;
};

type HeaderItem = {
  _id: string;
  headerTitle: string;
  headerDiscription: string;
};

type StepItem = {
  _id: string;
  image: string;
  title: string;
  discription: string;
  createdAt?: string;
  updatedAt?: string;
};

type HeaderFormState = {
  headerTitle: string;
  headerDiscription: string;
};

type StepFormState = {
  title: string;
  discription: string;
  imageFile: File | null;
};

const EMPTY_HEADER_FORM: HeaderFormState = {
  headerTitle: '',
  headerDiscription: '',
};

const EMPTY_STEP_FORM: StepFormState = {
  title: '',
  discription: '',
  imageFile: null,
};

const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return false;
  const parsed = payload as ApiEnvelope<unknown>;
  return parsed.success === false || parsed.status === false;
};

const getApiMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null;
  const parsed = payload as ApiEnvelope<unknown>;
  return typeof parsed.message === 'string' && parsed.message.trim()
    ? parsed.message
    : null;
};

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
};

const normalizeHeaderItems = (payload: unknown): HeaderItem[] => {
  const parsed = payload as ApiEnvelope<unknown>;
  const rows = toArray(parsed?.data);

  return rows.map((entry, index) => {
    const item = entry as Partial<HeaderItem>;
    const id = readString(item._id) || `header-${index}`;
    return {
      _id: id,
      headerTitle: readString(item.headerTitle),
      headerDiscription: readString(item.headerDiscription),
    };
  });
};

const normalizeStepItems = (payload: unknown): StepItem[] => {
  const parsed = payload as ApiEnvelope<unknown>;
  const rows = toArray(parsed?.data);

  return rows
    .map((entry, index) => {
      const item = entry as Partial<StepItem>;
      const id = readString(item._id) || `step-${index}`;
      const title = readString(item.title);
      const discription = readString(item.discription);
      const image = readString(item.image);

      if (!title && !discription && !image) return null;

      return {
        _id: id,
        title,
        discription,
        image,
        createdAt: readString(item.createdAt),
        updatedAt: readString(item.updatedAt),
      } as StepItem;
    })
    .filter((item): item is StepItem => item !== null);
};

export default function HowItWorksPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const stepFormRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [headerForm, setHeaderForm] = useState<HeaderFormState>(EMPTY_HEADER_FORM);
  const [stepForm, setStepForm] = useState<StepFormState>(EMPTY_STEP_FORM);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StepItem | null>(null);

  const apiBase = useMemo(getApiBase, []);
  const headerEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/yoloheat/header` : '/yoloheat/header'),
    [apiBase]
  );
  const stepsEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/yoloheat` : '/yoloheat'),
    [apiBase]
  );

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const headerQuery = useQuery({
    queryKey: ['yoloheat-header', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(headerEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load header data.');
      }

      return normalizeHeaderItems(payload);
    },
  });

  const stepsQuery = useQuery({
    queryKey: ['yoloheat-steps', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(stepsEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load steps data.');
      }

      return normalizeStepItems(payload);
    },
  });

  useEffect(() => {
    const currentHeader = headerQuery.data?.[0];
    if (!currentHeader) return;

    setHeaderForm({
      headerTitle: currentHeader.headerTitle,
      headerDiscription: currentHeader.headerDiscription,
    });
  }, [headerQuery.data]);

  const resetStepForm = () => {
    setStepForm(EMPTY_STEP_FORM);
    setEditingStepId(null);
    setCurrentImageUrl('');
    setPreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const postStepData = async (payload: FormData) => {
    const response = await fetch(stepsEndpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: payload,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || hasExplicitFailure(result)) {
      throw new Error(getApiMessage(result) ?? 'Failed to save step.');
    }

    return result;
  };

  const saveHeaderMutation = useMutation({
    mutationFn: async ({
      payload,
      headerId,
    }: {
      payload: HeaderFormState;
      headerId: string | null;
    }) => {
      const requestUrl = headerId ? `${headerEndpoint}/${headerId}` : headerEndpoint;
      const response = await fetch(requestUrl, {
        method: headerId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to save header.');
      }

      return result;
    },
    onSuccess: (_result, variables) => {
      toast.success(
        variables.headerId
          ? 'Header updated successfully.'
          : 'Header created successfully.'
      );
      queryClient.invalidateQueries({ queryKey: ['yoloheat-header', token] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save header.'
      );
    },
  });

  const saveStepMutation = useMutation({
    mutationFn: async ({
      formData,
      editId,
    }: {
      formData: StepFormState;
      editId: string | null;
    }) => {
      const title = formData.title.trim();
      const discription = formData.discription.trim();

      if (!title || !discription) {
        throw new Error('Please fill in both title and description.');
      }

      if (!editId && !formData.imageFile) {
        throw new Error('Image is required when adding a new step.');
      }

      if (!editId) {
        const createPayload = new FormData();
        createPayload.append('title', title);
        createPayload.append('discription', discription);
        if (formData.imageFile) {
          createPayload.append('image', formData.imageFile);
        }
        return postStepData(createPayload);
      }

      const updatePayload = new FormData();
      updatePayload.append('title', title);
      updatePayload.append('discription', discription);
      if (formData.imageFile) {
        updatePayload.append('image', formData.imageFile);
      }

      const patchResponse = await fetch(`${stepsEndpoint}/${editId}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: updatePayload,
      });
      const patchResult = await patchResponse.json().catch(() => null);

      if (patchResponse.ok && !hasExplicitFailure(patchResult)) {
        return patchResult;
      }

      if (patchResponse.status === 404 || patchResponse.status === 405) {
        if (!formData.imageFile) {
          throw new Error(
            'For this server edit fallback, please re-select an image and submit again.'
          );
        }

        const fallbackPayload = new FormData();
        fallbackPayload.append('title', title);
        fallbackPayload.append('discription', discription);
        fallbackPayload.append('image', formData.imageFile);
        return postStepData(fallbackPayload);
      }

      throw new Error(getApiMessage(patchResult) ?? 'Failed to update step.');
    },
    onSuccess: (_result, variables) => {
      toast.success(
        variables.editId ? 'Step updated successfully.' : 'Step added successfully.'
      );
      queryClient.invalidateQueries({ queryKey: ['yoloheat-steps', token] });
      resetStepForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save step.');
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${stepsEndpoint}/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to delete step.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Step deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['yoloheat-steps', token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
      if (deleteTarget?._id === editingStepId) {
        resetStepForm();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete step.'
      );
    },
  });

  const handleHeaderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentHeaderId = headerQuery.data?.[0]?._id ?? null;
    const payload = {
      headerTitle: headerForm.headerTitle.trim(),
      headerDiscription: headerForm.headerDiscription.trim(),
    };

    if (!payload.headerTitle || !payload.headerDiscription) {
      toast.error('Please fill in header title and description.');
      return;
    }

    saveHeaderMutation.mutate({
      payload,
      headerId: currentHeaderId,
    });
  };

  const handleStepSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStepMutation.mutate({
      formData: stepForm,
      editId: editingStepId,
    });
  };

  const handleHeaderChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setHeaderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStepFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setStepForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStepImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setStepForm((prev) => ({
      ...prev,
      imageFile: file,
    }));

    if (!file) {
      setPreviewUrl('');
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
  };

  const handleEditStep = (item: StepItem) => {
    setEditingStepId(item._id);
    setStepForm({
      title: item.title,
      discription: item.discription,
      imageFile: null,
    });
    setCurrentImageUrl(item.image);
    setPreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    stepFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenDelete = (item: StepItem) => {
    setDeleteTarget(item);
    setOpenDeleteModal(true);
  };

  const handleCloseDelete = (nextOpen: boolean) => {
    setOpenDeleteModal(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteStepMutation.mutate(deleteTarget._id);
  };

  const combinedLoading =
    status === 'loading' || headerQuery.isLoading || stepsQuery.isLoading;
  const previewImage = previewUrl || currentImageUrl;
  const deleteLabel = deleteTarget?.title || 'this step';

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage How It Works content.
      </div>
    );
  }

  if (combinedLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
          <div className="h-[520px] animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-[520px] animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
  

      <div className="w-full">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">
              Header Information
            </h2>
          </div>

          <form onSubmit={handleHeaderSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="headerTitle">Header Title</Label>
              <Input
                id="headerTitle"
                name="headerTitle"
                value={headerForm.headerTitle}
                onChange={handleHeaderChange}
                className="h-11"
                placeholder="How Does YOLO HEAT Work?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerDiscription">Header Description</Label>
              <Textarea
                id="headerDiscription"
                name="headerDiscription"
                value={headerForm.headerDiscription}
                onChange={handleHeaderChange}
                className="min-h-28"
                placeholder="Get your quote, book your service..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saveHeaderMutation.isPending}
                className="h-11 bg-[#FBFF26] px-6 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveHeaderMutation.isPending
                  ? 'Saving...'
                  : headerQuery.data?.[0]?._id
                    ? 'Edit Header'
                    : 'Create Header'}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div
          ref={stepFormRef}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">
              {editingStepId ? 'Edit Step' : 'Add New Step'}
            </h2>
          </div>

          <form onSubmit={handleStepSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="step-title">Title</Label>
              <Input
                id="step-title"
                name="title"
                value={stepForm.title}
                onChange={handleStepFieldChange}
                className="h-11"
                placeholder="Discover"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="step-discription">Description</Label>
              <Textarea
                id="step-discription"
                name="discription"
                value={stepForm.discription}
                onChange={handleStepFieldChange}
                className="min-h-32"
                placeholder="Answer a few quick questions..."
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="step-image">Image Upload</Label>
              <input
                id="step-image"
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleStepImageChange}
                className="hidden"
              />
              <label
                htmlFor="step-image"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 transition hover:bg-[#F1F5F9]"
              >
                <UploadCloud className="h-6 w-6 text-[#0E7490]" />
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Click to choose image
                  </p>
                  <p className="text-xs text-[#64748B]">
                    JPG, PNG or WEBP image for this step
                  </p>
                </div>
              </label>

              {previewImage ? (
                <div className="relative h-44 overflow-hidden rounded-xl border border-[#E2E8F0]">
                  <Image
                    src={previewImage}
                    alt={stepForm.title || 'Step preview'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-7 text-center text-sm text-[#64748B]">
                  No image selected yet.
                </div>
              )}

              {editingStepId && !stepForm.imageFile && (
                <p className="text-xs text-[#64748B]">
                  Editing mode: keep current image or upload a new image.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={saveStepMutation.isPending}
                className="h-11 bg-[#FBFF26] px-6 font-normal text-xl text-[#2D3D4D] hover:bg-[#FBFF26]/95"
              >
                {saveStepMutation.isPending
                  ? 'Saving...'
                  : editingStepId
                    ? 'Update Step'
                    : 'Add Step'}
              </Button>

              {editingStepId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetStepForm}
                  className="h-11 border-[#94A3B8] px-6 text-[#334155]"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Existing Steps</h2>
          </div>

          {stepsQuery.isError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {stepsQuery.error instanceof Error
                ? stepsQuery.error.message
                : 'Failed to load steps.'}
            </div>
          ) : stepsQuery.data && stepsQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {stepsQuery.data.map((item) => (
                <article
                  key={item._id}
                  className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-[#E2E8F0]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title || 'Step image'}
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                        No image
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[#0F172A]">
                    {item.title || 'Untitled'}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#475569]">
                    {item.discription || 'No description'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleEditStep(item)}
                      className="h-10 border-[#94A3B8] text-[#334155]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleOpenDelete(item)}
                      disabled={deleteStepMutation.isPending}
                      className="h-10 bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-12 text-center text-sm text-[#64748B]">
              No steps found yet. Add your first step from the form.
            </div>
          )}
        </div>
      </section>

      <Dialog open={openDeleteModal} onOpenChange={handleCloseDelete}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[420px] max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Delete Step?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You are about to delete <span className="font-semibold">{deleteLabel}</span>.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCloseDelete(false)}
                disabled={deleteStepMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteStepMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteStepMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
