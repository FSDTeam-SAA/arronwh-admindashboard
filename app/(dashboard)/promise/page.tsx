'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Palette, UploadCloud } from 'lucide-react';

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T[] | T | null;
};

type PromiseBox = {
  _id: string;
  title: string;
  description: string;
  image: string;
  backgroundcolor: string;
  textcolor: string;
  createdAt?: string;
  updatedAt?: string;
};

type PromiseFormState = {
  title: string;
  description: string;
  backgroundcolor: string;
  textcolor: string;
};

const EMPTY_FORM: PromiseFormState = {
  title: '',
  description: '',
  backgroundcolor: '#FFFFFF',
  textcolor: '#000000',
};

const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const getBoxtEndpoint = () => {
  const base = getApiBase();
  return base ? `${base}/boxt` : '/api/v1/boxt';
};

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

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

const normalizeBoxt = (payload: unknown): PromiseBox | null => {
  const parsed = payload as ApiEnvelope<unknown>;
  const raw = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Partial<PromiseBox>;
  const id = readString(item._id);
  if (!id) return null;

  return {
    _id: id,
    title: readString(item.title),
    description: readString(item.description),
    image: readString(item.image),
    backgroundcolor: readString(item.backgroundcolor) || '#FFFFFF',
    textcolor: readString(item.textcolor) || '#000000',
    createdAt: readString(item.createdAt),
    updatedAt: readString(item.updatedAt),
  };
};

export default function PromisePage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PromiseFormState>(EMPTY_FORM);
  const [boxId, setBoxId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const boxtEndpoint = useMemo(getBoxtEndpoint, []);

  const boxtQuery = useQuery({
    queryKey: ['promise-boxt', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(boxtEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load promise data.');
      }

      const normalized = normalizeBoxt(payload);
      if (!normalized) {
        throw new Error('Promise data not found.');
      }

      return normalized;
    },
  });

  useEffect(() => {
    if (!boxtQuery.data) return;

    setBoxId(boxtQuery.data._id);
    setFormData({
      title: boxtQuery.data.title,
      description: boxtQuery.data.description,
      backgroundcolor: boxtQuery.data.backgroundcolor,
      textcolor: boxtQuery.data.textcolor,
    });
    setCurrentImageUrl(boxtQuery.data.image);
    setPreviewImageUrl(boxtQuery.data.image);
    setSelectedImageFile(null);
  }, [boxtQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async ({
      values,
      imageFile,
    }: {
      values: PromiseFormState;
      imageFile: File | null;
    }) => {
      if (!boxId) {
        throw new Error('Promise ID not found.');
      }

      const payload = new FormData();
      payload.append('title', values.title.trim());
      payload.append('description', values.description.trim());
      payload.append('backgroundcolor', values.backgroundcolor.trim());
      payload.append('textcolor', values.textcolor.trim());

      if (imageFile) {
        payload.append('image', imageFile);
      }

      const response = await fetch(`${boxtEndpoint}/${boxId}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to update promise data.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Promise section updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['promise-boxt', token] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update promise data.'
      );
    },
  });

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);

    if (!file) {
      setPreviewImageUrl(currentImageUrl);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPreviewImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    updateMutation.mutate({ values: formData, imageFile: selectedImageFile });
  };

  const combinedLoading =
    status === 'loading' || (status === 'authenticated' && boxtQuery.isLoading);

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage Promise content.
      </div>
    );
  }

  if (combinedLoading) {
    return (
      <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm animate-pulse">
        <div className="mb-6 h-7 w-52 rounded-md bg-slate-200" />

        <div className="space-y-5">
          <div>
            <div className="mb-2 h-5 w-24 rounded bg-slate-200" />
            <div className="h-11 w-full rounded-md bg-slate-200" />
          </div>

          <div>
            <div className="mb-2 h-5 w-32 rounded bg-slate-200" />
            <div className="h-28 w-full rounded-md bg-slate-200" />
          </div>

          <div>
            <div className="mb-2 h-5 w-20 rounded bg-slate-200" />
            <div className="h-11 w-full rounded-md bg-slate-200" />
          </div>

          <div className="h-48 w-full rounded-xl bg-slate-200" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 h-5 w-36 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-md bg-slate-200" />
            </div>
            <div>
              <div className="mb-2 h-5 w-24 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-md bg-slate-200" />
            </div>
          </div>

          <div className="h-11 w-40 rounded-md bg-slate-200" />
        </div>
      </div>
    );
  }

  if (boxtQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {boxtQuery.error instanceof Error
          ? boxtQuery.error.message
          : 'Failed to load promise data.'}
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[#0F172A]">Edit Promise Section</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="h-11"
              placeholder="Boxt Title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="min-h-28"
              placeholder="Boxt Description"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#0E7490]" />
              Image
            </Label>
            <Input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="imageFile"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 transition hover:bg-[#F1F5F9]"
            >
              <UploadCloud className="h-6 w-6 text-[#0E7490]" />
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Click to choose image</p>
                <p className="text-xs text-[#64748B]">PNG, JPG or WEBP</p>
              </div>
            </label>

            {previewImageUrl ? (
              <div className="relative h-64 w-full max-w-md overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-2">
                <Image
                  src={previewImageUrl}
                  alt={formData.title || 'Promise preview'}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#64748B]">
                No image selected yet.
              </div>
            )}

            {!selectedImageFile && currentImageUrl && (
              <p className="text-xs text-[#64748B]">
                Current image is kept. Select a new image only if you want to replace it.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backgroundcolor" className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#0E7490]" />
                Background Color
              </Label>
              <div className="flex gap-3">
                <Input
                  id="backgroundcolor"
                  type="color"
                  name="backgroundcolor"
                  value={formData.backgroundcolor}
                  onChange={handleInputChange}
                  className="h-11 w-20 p-1"
                />
                <Input
                  name="backgroundcolor"
                  value={formData.backgroundcolor}
                  onChange={handleInputChange}
                  className="h-11 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textcolor" className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#0E7490]" />
                Text Color
              </Label>
              <div className="flex gap-3">
                <Input
                  id="textcolor"
                  type="color"
                  name="textcolor"
                  value={formData.textcolor}
                  onChange={handleInputChange}
                  className="h-11 w-20 p-1"
                />
                <Input
                  name="textcolor"
                  value={formData.textcolor}
                  onChange={handleInputChange}
                  className="h-11 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending || !boxId}
              className="h-11 bg-[#F5D64E] px-6 font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Update Promise'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
