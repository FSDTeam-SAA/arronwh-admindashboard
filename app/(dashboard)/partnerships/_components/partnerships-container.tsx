'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PartnershipsData = {
  _id: string;
  title: string;
  subTitle: string;
  backgroundColor: string;
  textColor: string;
};

type PartnershipsFormState = {
  title: string;
  subTitle: string;
  backgroundColor: string;
  textColor: string;
};

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T | null;
};

const PARTNERSHIPS_ID = '6a0e9c437f45df0f7d79d87c';

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

export default function PartnershipsContainer() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PartnershipsFormState>({
    title: '',
    subTitle: '',
    backgroundColor: '#000000',
    textColor: '#ffffff',
  });

  const apiBase = useMemo(getApiBase, []);
  const partnershipsEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/socialpartership/${PARTNERSHIPS_ID}` : `/socialpartership/${PARTNERSHIPS_ID}`),
    [apiBase]
  );

  const partnershipsQuery = useQuery({
    queryKey: ['partnerships-data', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(partnershipsEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load partnerships data.');
      }

      return payload.data as PartnershipsData;
    },
  });

  useEffect(() => {
    if (partnershipsQuery.data) {
      setFormData({
        title: partnershipsQuery.data.title || '',
        subTitle: partnershipsQuery.data.subTitle || '',
        backgroundColor: partnershipsQuery.data.backgroundColor || '#000000',
        textColor: partnershipsQuery.data.textColor || '#ffffff',
      });
    }
  }, [partnershipsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: PartnershipsFormState) => {
      const response = await fetch(partnershipsEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to update partnerships data.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Partnerships data updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['partnerships-data', token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save partnerships data.');
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.title || !formData.subTitle) {
      toast.error('Please fill in both the title and subTitle.');
      return;
    }

    saveMutation.mutate(formData);
  };

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage Partnerships content.
      </div>
    );
  }

  if (status === 'loading' || partnershipsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (partnershipsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {partnershipsQuery.error instanceof Error ? partnershipsQuery.error.message : 'Failed to load data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="w-full">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Partnerships Information</h2>
            <p className="text-sm text-[#64748B] mt-1">Manage the partnerships information displayed on the website.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="Partnerships"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subTitle">Subtitle</Label>
                <Textarea
                  id="subTitle"
                  name="subTitle"
                  value={formData.subTitle}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  placeholder="Partner with us..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="backgroundColor"
                    name="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="h-11 w-20 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    name="backgroundColor"
                    className="h-11 flex-1 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="textColor"
                    name="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="h-11 w-20 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.textColor}
                    onChange={handleChange}
                    name="textColor"
                    className="h-11 flex-1 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-11 bg-[#FBFF26] px-8 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : 'Update Partnerships Information'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}