'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Policy {
  _id: string;
  title: string;
  description: string;
}

const PolicyPage = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?? '';
  const queryClient = useQueryClient();

  // Fetch Policy
  const { data, isLoading, error } = useQuery({
    queryKey: ['policy', token],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/policy`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch policy');
      const json = await res.json();
      return json.data[0] as Policy; // Taking first item
    },
  });

  // Edit Mutation
  const mutation = useMutation({
    mutationFn: async (updatedData: { title: string; description: string }) => {
      if (!data?._id) throw new Error('Policy ID not found');

      const res = await fetch(`${apiBase}/policy/${data._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error('Failed to update policy');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Privacy Policy updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['policy', token] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to update policy';
      toast.error(message);
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Populate form when data loads
  React.useEffect(() => {
    if (data) {
      setFormData({
        title: data.title,
        description: data.description,
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  // Skeleton Loader
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          
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
    return <div className="text-red-500 p-6">Error loading policy: {error.message}</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">Edit Privacy Policy</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
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

        {/* Description with React Quill */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <div className="b">
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(content) => setFormData({ ...formData, description: content })}
              className="h-auto"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-8 py-3 bg-[#FBFF26] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {mutation.isPending ? 'Saving...' : 'Update Policy'}
        </button>
      </form>
    </div>
  );
};

export default PolicyPage;
