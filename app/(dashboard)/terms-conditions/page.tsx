'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface TermsCondition {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
}

type ApiEnvelope<T> = {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T[] | T | null;
};

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

const getFirstRow = <T,>(payload: unknown) => {
  const parsed = payload as ApiEnvelope<T>;
  if (Array.isArray(parsed?.data)) return parsed.data[0] ?? null;
  return (parsed?.data ?? null) as T | null;
};

const TermsConditionsPage = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['termsconditions', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await fetch(`${apiBase}/termsconditions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || hasExplicitFailure(json)) {
        throw new Error(
          getApiMessage(json) ?? 'Failed to fetch terms and conditions'
        );
      }

      const row = getFirstRow<TermsCondition>(json);
      if (!row?._id) {
        throw new Error('Terms and conditions data not found');
      }

      return row;
    },
  });

  const mutation = useMutation({
    mutationFn: async (updatedData: {
      title: string;
      subtitle: string;
      description: string;
    }) => {
      if (!data?._id) throw new Error('Terms and conditions ID not found');

      const res = await fetch(`${apiBase}/termsconditions/${data._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok || hasExplicitFailure(result)) {
        throw new Error(
          getApiMessage(result) ?? 'Failed to update terms and conditions'
        );
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Terms & Conditions updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['termsconditions', token] });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update terms and conditions';
      toast.error(message);
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
  });

  React.useEffect(() => {
    if (data) {
      setFormData({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>

          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>

          <div className="mb-6">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>

          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-6">
        Error loading terms and conditions: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">Edit Terms &amp; Conditions</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subtitle</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, subtitle: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <div className="b">
            <ReactQuill
              theme="snow"
              value={formData.description}  
              onChange={(content) =>
                setFormData({ ...formData, description: content })
              }
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],  
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-8 py-3 bg-[#FBFF26] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {mutation.isPending ? 'Saving...' : 'Update Terms & Conditions'}
        </button>
      </form>
    </div>
  );
};

export default TermsConditionsPage;
