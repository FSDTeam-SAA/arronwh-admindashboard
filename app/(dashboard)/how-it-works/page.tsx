'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

type YoloHeat = {
  _id: string;
  image: string;
  title: string;
  discription: string;
  createdAt?: string;
  updatedAt?: string;
};

type FormData = {
  heder: string;
  hederDiscription: string;
  image: string;
  title: string;
  discription: string;
};

const Page = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<YoloHeat | null>(null);

  const [formData, setFormData] = useState<FormData>({
    heder: '',
    hederDiscription: '',
    image: '',
    title: '',
    discription: '',
  });

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ['yoloheat', token],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/yoloheat`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as YoloHeat[];
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FormData }) => {
      const res = await fetch(`${apiBase}/yoloheat/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['yoloheat', token] });
      resetForm();
    },
    onError: () => toast.error('Failed to update'),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBase}/yoloheat/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Delete failed');
      return id;
    },
    onSuccess: () => {
      toast.success('Item deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['yoloheat', token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const resetForm = () => {
    setFormData({
      heder: '',
      hederDiscription: '',
      image: '',
      title: '',
      discription: '',
    });
    setImagePreview(null);
    setIsEditing(false);
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setFormData(prev => ({ ...prev, image: url }));
    }
  };

  const handleEdit = (item: YoloHeat) => {
    setFormData({
      heder: item.title,
      hederDiscription: '',
      image: item.image,
      title: item.title,
      discription: item.discription,
    });
    setImagePreview(item.image);
    setEditId(item._id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteOpen = (item: YoloHeat) => {
    setDeleteTarget(item);
    setOpenDeleteModal(true);
  };

  const handleDeleteClose = (nextOpen: boolean) => {
    setOpenDeleteModal(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id);
  };

  const deleteLabel = deleteTarget?.title ?? 'this item';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) {
      toast.error("Edit mode only for now");
      return;
    }
    updateMutation.mutate({ id: editId, payload: formData });
  };

  return (
    <div className="min-h-screen py-10">
      <div className="w-full">

        {/* Form */}
        <div className="bg-white shadow-lg rounded-2xl p-8 mb-12">
          <h1 className="text-3xl font-bold mb-10 text-[#111111]">
            How It Works Management
          </h1>

          <h2 className="text-2xl font-semibold mb-6">
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Header</label>
                <input
                  type="text"
                  name="heder"
                  value={formData.heder}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Header"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Title"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Header Description</label>
              <textarea
                name="hederDiscription"
                value={formData.hederDiscription}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="discription"
                value={formData.discription}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
              {imagePreview && (
                <Image
                  src={imagePreview}
                  width={1000}
                  height={1000}
                  alt="preview"
                  className="mt-4 w-full max-h-64 object-cover rounded-lg border"
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-[#00A56F] h-[48px] px-6 text-white font-semibold  rounded-lg disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Updating...' : isEditing ? 'Update Item' : 'Create Item'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Data List */}
        <h2 className="text-2xl font-semibold mb-6">Existing Items</h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl shadow p-6">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={1000}
                  height={1000}
                  className="w-full h-52 object-cover rounded-xl mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 line-clamp-3 mb-6">{item.discription}</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteOpen(item)}
                    disabled={deleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openDeleteModal} onOpenChange={handleDeleteClose}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[420px] max-w-[92vw] sm:max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Are you sure?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You want to delete {deleteLabel} from this Dashboard.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteClose(false)}
                disabled={deleteMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#F5D64E] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default Page;
