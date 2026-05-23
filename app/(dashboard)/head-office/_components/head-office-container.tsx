'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { X } from 'lucide-react';

type HeadOfficeData = {
  _id: string;
  bannerImage: string;
  header: string;
  description: string;
};

type HeadOfficeFormState = {
  header: string;
  description: string;
  imageFile: File | null;
};

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T | null;
};

const HEAD_OFFICE_ID = '6a0e9d74c834986c0c95b953';

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

export default function HeadOfficeContainer() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<HeadOfficeFormState>({
    header: '',
    description: '',
    imageFile: null,
  });

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const apiBase = useMemo(getApiBase, []);
  const headOfficeEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/headoffice/${HEAD_OFFICE_ID}` : `/headoffice/${HEAD_OFFICE_ID}`),
    [apiBase]
  );

  const headOfficeQuery = useQuery({
    queryKey: ['headoffice-data', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(headOfficeEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load head office data.');
      }

      return payload.data as HeadOfficeData;
    },
  });

  useEffect(() => {
    if (headOfficeQuery.data) {
      setFormData({
        header: headOfficeQuery.data.header || '',
        description: headOfficeQuery.data.description || '',
        imageFile: null,
      });
      setCurrentImage(headOfficeQuery.data.bannerImage || null);
    }
  }, [headOfficeQuery.data]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  const saveMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await fetch(headOfficeEndpoint, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to update head office data.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Head office data updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['headoffice-data', token] });
      setFormData((prev) => ({ ...prev, imageFile: null }));
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
        setNewImagePreview(null);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save head office data.');
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === 'file') {
      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files?.[0] ?? null;

      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }

      if (file) {
        setNewImagePreview(URL.createObjectURL(file));
      } else {
        setNewImagePreview(null);
      }

      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.header || !formData.description) {
      toast.error('Please fill in both the header and description.');
      return;
    }

    const payload = new FormData();
    payload.append('header', formData.header);
    payload.append('description', formData.description);
    if (formData.imageFile) {
      payload.append('bannerImage', formData.imageFile);
    } else {
      payload.append('bannerImage', ''); // Fallback for when no new image is provided
    }

    saveMutation.mutate(payload);
  };

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage Head Office content.
      </div>
    );
  }

  if (status === 'loading' || headOfficeQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (headOfficeQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {headOfficeQuery.error instanceof Error ? headOfficeQuery.error.message : 'Failed to load data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="w-full">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Head Office Information</h2>
            <p className="text-sm text-[#64748B] mt-1">Manage the head office information displayed on the website.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="header">Header</Label>
                <Input
                  id="header"
                  name="header"
                  value={formData.header}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="Our Head Office"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  placeholder="We are located at..."
                />
              </div>
            </div>

            <div>
              <Label className="text-lg font-normal text-[#2D3D4D]">Current Banner Image</Label>
              {currentImage ? (
                <div className="mt-2 relative group w-max">
                  <Image
                    src={currentImage}
                    alt="Current banner"
                    width={160}
                    height={100}
                    className="h-24 w-40 rounded-lg border object-cover"
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">No banner image currently set.</p>
              )}
            </div>

            <div>
              <Label className="text-lg font-normal text-[#2D3D4D]">Upload New Banner Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="mt-1.5 h-12"
              />
              {formData.imageFile && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 bg-[#F8F9FA] border border-gray-200 text-[#2D3D4D] px-3 py-1.5 rounded-full text-sm w-fit">
                    {formData.imageFile.name}
                    <button
                      type="button"
                      onClick={removeNewImage}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {newImagePreview && (
                    <div className="relative w-fit group">
                      <Image
                        src={newImagePreview}
                        alt="New image preview"
                        width={160}
                        height={100}
                        className="h-24 w-40 rounded-lg border object-cover ring-2 ring-[#FBFF26]"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                         <p className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Selected File</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Upload a new image only if you want to replace the current banner.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-11 bg-[#FBFF26] px-8 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : 'Update Head Office Information'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}