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
  valueTitle: string;
  valueDetail: string;
};

type ValueItem = {
  _id: string;
  image: string;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

type HeaderFormState = {
  valueTitle: string;
  valueDetail: string;
};

type ValueFormState = {
  title: string;
  description: string;
  imageFile: File | null;
};

const EMPTY_HEADER_FORM: HeaderFormState = {
  valueTitle: '',
  valueDetail: '',
};

const EMPTY_VALUE_FORM: ValueFormState = {
  title: '',
  description: '',
  imageFile: null,
};

const VALUES_HEADER_ID = "6a0401f625e9892d6d329c3e";

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

const normalizeHeaderItem = (payload: unknown): HeaderItem | null => {
  const parsed = payload as ApiEnvelope<unknown>;
  const item = parsed?.data as Partial<HeaderItem> | null;
  
  if (!item || !item._id) return null;

  return {
    _id: readString(item._id),
    valueTitle: readString(item.valueTitle),
    valueDetail: readString(item.valueDetail),
  };
};

const normalizeValueItems = (payload: unknown): ValueItem[] => {
  const parsed = payload as ApiEnvelope<unknown>;
  const rows = toArray(parsed?.data);

  return rows
    .map((entry, index) => {
      const item = entry as Partial<ValueItem>;
      const id = readString(item._id) || `value-${index}`;
      const title = readString(item.title);
      const description = readString(item.description);
      const image = readString(item.image);

      if (!title && !description && !image) return null;

      return {
        _id: id,
        title,
        description,
        image,
        createdAt: readString(item.createdAt),
        updatedAt: readString(item.updatedAt),
      } as ValueItem;
    })
    .filter((item): item is ValueItem => item !== null);
};

export default function AboutOurValuesContainer() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const valueFormRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [headerForm, setHeaderForm] = useState<HeaderFormState>(EMPTY_HEADER_FORM);
  const [valueForm, setValueForm] = useState<ValueFormState>(EMPTY_VALUE_FORM);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ValueItem | null>(null);

  const apiBase = useMemo(getApiBase, []);
  const headerEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/values/${VALUES_HEADER_ID}` : `/values/${VALUES_HEADER_ID}`),
    [apiBase]
  );
  const valuesDataEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/values/data` : '/values/data'),
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
    queryKey: ['about-values-header', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(headerEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load values header data.');
      }

      return normalizeHeaderItem(payload);
    },
  });

  const valuesQuery = useQuery({
    queryKey: ['about-values-data', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(valuesDataEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load values data.');
      }

      return normalizeValueItems(payload);
    },
  });

  useEffect(() => {
    const currentHeader = headerQuery.data;
    if (!currentHeader) return;

    setHeaderForm({
      valueTitle: currentHeader.valueTitle,
      valueDetail: currentHeader.valueDetail,
    });
  }, [headerQuery.data]);

  const resetValueForm = () => {
    setValueForm(EMPTY_VALUE_FORM);
    setEditingValueId(null);
    setCurrentImageUrl('');
    setPreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const saveHeaderMutation = useMutation({
    mutationFn: async (payload: HeaderFormState) => {
      const response = await fetch(headerEndpoint, {
        method: 'PATCH',
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
    onSuccess: () => {
      toast.success('Values header updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['about-values-header', token] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save header.'
      );
    },
  });

  const saveValueMutation = useMutation({
    mutationFn: async ({
      formData,
      editId,
    }: {
      formData: ValueFormState;
      editId: string | null;
    }) => {
      const title = formData.title.trim();
      const description = formData.description.trim();

      if (!title || !description) {
        throw new Error('Please fill in both title and description.');
      }

      const payload = new FormData();
      payload.append('title', title);
      payload.append('description', description);
      if (formData.imageFile) {
        payload.append('image', formData.imageFile);
      }

      const url = editId ? `${valuesDataEndpoint}/${editId}` : valuesDataEndpoint;
      const response = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? `Failed to ${editId ? 'update' : 'create'} value.`);
      }

      return result;
    },
    onSuccess: (_result, variables) => {
      toast.success(
        variables.editId ? 'Value updated successfully.' : 'Value created successfully.'
      );
      queryClient.invalidateQueries({ queryKey: ['about-values-data', token] });
      resetValueForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save value.');
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${valuesDataEndpoint}/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to delete value.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Value deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['about-values-data', token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
      if (deleteTarget?._id === editingValueId) {
        resetValueForm();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete value.'
      );
    },
  });

  const handleHeaderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      valueTitle: headerForm.valueTitle.trim(),
      valueDetail: headerForm.valueDetail.trim(),
    };

    if (!payload.valueTitle || !payload.valueDetail) {
      toast.error('Please fill in both title and detail.');
      return;
    }

    saveHeaderMutation.mutate(payload);
  };

  const handleValueSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveValueMutation.mutate({
      formData: valueForm,
      editId: editingValueId,
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

  const handleValueFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValueForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValueImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setValueForm((prev) => ({
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

  const handleEditValue = (item: ValueItem) => {
    setEditingValueId(item._id);
    setValueForm({
      title: item.title,
      description: item.description,
      imageFile: null,
    });
    setCurrentImageUrl(item.image);
    setPreviewUrl('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    valueFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenDelete = (item: ValueItem) => {
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
    deleteValueMutation.mutate(deleteTarget._id);
  };

  const combinedLoading =
    status === 'loading' || headerQuery.isLoading || valuesQuery.isLoading;
  const previewImage = previewUrl || currentImageUrl;
  const deleteLabel = deleteTarget?.title || 'this value';

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage Our Values content.
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
              <Label htmlFor="valueTitle">Value Title</Label>
              <Input
                id="valueTitle"
                name="valueTitle"
                value={headerForm.valueTitle}
                onChange={handleHeaderChange}
                className="h-11"
                placeholder="Core Values"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueDetail">Value Detail</Label>
              <Textarea
                id="valueDetail"
                name="valueDetail"
                value={headerForm.valueDetail}
                onChange={handleHeaderChange}
                className="min-h-28"
                placeholder="These are the principles that guide our work."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saveHeaderMutation.isPending}
                className="h-11 bg-[#FBFF26] px-6 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveHeaderMutation.isPending ? 'Saving...' : 'Update Header'}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div
          ref={valueFormRef}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">
              {editingValueId ? 'Edit Value' : 'Add New Value'}
            </h2>
          </div>

          <form onSubmit={handleValueSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={valueForm.title}
                onChange={handleValueFieldChange}
                className="h-11"
                placeholder="Innovation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={valueForm.description}
                onChange={handleValueFieldChange}
                className="min-h-32"
                placeholder="We strive to innovate in everything we do."
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="value-image">Image Upload</Label>
              <input
                id="value-image"
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleValueImageChange}
                className="hidden"
              />
              <label
                htmlFor="value-image"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 transition hover:bg-[#F1F5F9]"
              >
                <UploadCloud className="h-6 w-6 text-[#0E7490]" />
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Click to choose image
                  </p>
                  <p className="text-xs text-[#64748B]">
                    JPG, PNG or WEBP image for this value
                  </p>
                </div>
              </label>

              {previewImage ? (
                <div className="relative h-44 overflow-hidden rounded-xl border border-[#E2E8F0]">
                  <Image
                    src={previewImage}
                    alt={valueForm.title || 'Value preview'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-7 text-center text-sm text-[#64748B]">
                  No image selected yet.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={saveValueMutation.isPending}
                className="h-11 bg-[#FBFF26] px-6 font-normal text-xl text-[#2D3D4D] hover:bg-[#FBFF26]/95"
              >
                {saveValueMutation.isPending
                  ? 'Saving...'
                  : editingValueId
                    ? 'Update Value'
                    : 'Add Value'}
              </Button>

              {editingValueId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetValueForm}
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
            <h2 className="text-xl font-semibold text-[#0F172A]">Existing Values</h2>
          </div>

          {valuesQuery.isError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {valuesQuery.error instanceof Error
                ? valuesQuery.error.message
                : 'Failed to load values.'}
            </div>
          ) : valuesQuery.data && valuesQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {valuesQuery.data.map((item) => (
                <article
                  key={item._id}
                  className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-[#E2E8F0]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title || 'Value image'}
                        fill
                        className="object-contain transition group-hover:scale-[1.02]"
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
                    {item.description || 'No description'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleEditValue(item)}
                      className="h-10 border-[#94A3B8] text-[#334155]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleOpenDelete(item)}
                      disabled={deleteValueMutation.isPending}
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
              No values found yet. Add your first value from the form.
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
              Delete Value?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You are about to delete <span className="font-semibold">{deleteLabel}</span>.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCloseDelete(false)}
                disabled={deleteValueMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteValueMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteValueMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
