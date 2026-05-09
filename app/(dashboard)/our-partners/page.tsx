'use client';
import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Upload, Trash2, X } from "lucide-react";
import Image from "next/image";

interface Partner {
  _id: string;
  excellent: string;
  title: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface FormDataState {
  excellent: string;
  title: string;
  images: File[];
}

type ConfirmAction =
  | { type: "delete-partners" }
  | { type: "remove-image"; imageUrl: string }
  | null;

const PartnerForm = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [formData, setFormData] = useState<FormDataState>({
    excellent: "",
    title: "",
    images: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removingImageUrl, setRemovingImageUrl] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const queryClient = useQueryClient();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const authHeaders: HeadersInit | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  // Fetch partners
  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["partners", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(`${apiBase}/partners`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch partners");
      const result = await response.json();
      return result.data as Partner[];
    },
  });

  const currentPartner = partnersData?.[0] || null;

  // Populate form when data is loaded (for editing)
  useEffect(() => {
    if (currentPartner) {
      setFormData({
        excellent: currentPartner.excellent,
        title: currentPartner.title,
        images: [], // New files only
      });
      setExistingImages(currentPartner.images);
      setEditingId(currentPartner._id);
    } else {
      // Reset for create mode
      setFormData({ excellent: "", title: "", images: [] });
      setExistingImages([]);
      setEditingId(null);
    }
  }, [currentPartner]);

  // Create / Update Mutation
  const mutation = useMutation({
    mutationFn: async ({ data, isUpdate }: { data: FormDataState; isUpdate: boolean }) => {
      if (isUpdate && editingId) {
        const updateForm = new FormData();
        updateForm.append("excellent", data.excellent);
        updateForm.append("title", data.title);

        const updateResponse = await fetch(`${apiBase}/partners/${editingId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: updateForm,
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(errorText || "Failed to update partner details.");
        }

        if (data.images.length > 0) {
          const addImageForm = new FormData();
          data.images.forEach((image) => {
            addImageForm.append("images", image);
          });

          let addImageResponse = await fetch(`${apiBase}/partners/${editingId}/add-image`, {
            method: "PATCH",
            headers: authHeaders,
            body: addImageForm,
          });

          // Fallback for APIs that expose this route as POST.
          if (addImageResponse.status === 405) {
            addImageResponse = await fetch(`${apiBase}/partners/${editingId}/add-image`, {
              method: "POST",
              headers: authHeaders,
              body: addImageForm,
            });
          }

          if (!addImageResponse.ok) {
            const errorText = await addImageResponse.text();
            throw new Error(errorText || "Failed to add new images.");
          }
        }

        return updateResponse.json().catch(() => null);
      }

      const createForm = new FormData();
      createForm.append("excellent", data.excellent);
      createForm.append("title", data.title);
      data.images.forEach((image) => {
        createForm.append("images", image);
      });

      const createResponse = await fetch(`${apiBase}/partners`, {
        method: "POST",
        headers: authHeaders,
        body: createForm,
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(errorText || "Failed to create partner.");
      }

      return createResponse.json();
    },
    onSuccess: () => {
      toast.success(editingId ? "Partners updated successfully!" : "Partners created successfully!");
      queryClient.invalidateQueries({ queryKey: ["partners", token] });
      // Reset form after success
      setFormData({ excellent: "", title: "", images: [] });
      setExistingImages([]);
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save data.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiBase}/partners/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Partners deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["partners", token] });
      setFormData({ excellent: "", title: "", images: [] });
      setExistingImages([]);
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete.");
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      const removeImageHeaders: HeadersInit = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };

      let response = await fetch(`${apiBase}/partners/${id}/remove-image`, {
        method: "PATCH",
        headers: removeImageHeaders,
        body: JSON.stringify({ imageUrl }),
      });

      // Fallback for APIs that expose this route as POST.
      if (response.status === 405) {
        response = await fetch(`${apiBase}/partners/${id}/remove-image`, {
          method: "POST",
          headers: removeImageHeaders,
          body: JSON.stringify({ imageUrl }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove image.");
      }

      return response.json().catch(() => null);
    },
    onSuccess: () => {
      toast.success("Image removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["partners", token] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove image.");
    },
    onSettled: () => {
      setRemovingImageUrl(null);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(e.target.files!),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.excellent || !formData.title) {
      toast.error("Please fill all fields");
      return;
    }

    // Allow submit without new images during edit (to update text only)
    if (!editingId && formData.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    mutation.mutate({
      data: formData,
      isUpdate: !!editingId,
    });
  };

  const handleDelete = () => {
    if (!editingId) return;
    setConfirmAction({ type: "delete-partners" });
  };

  const removeNewImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (imageUrl: string) => {
    if (!editingId) return;
    setConfirmAction({ type: "remove-image", imageUrl });
  };

  const handleConfirmAction = () => {
    if (!editingId || !confirmAction) return;

    if (confirmAction.type === "delete-partners") {
      deleteMutation.mutate(editingId, {
        onSettled: () => setConfirmAction(null),
      });
      return;
    }

    setRemovingImageUrl(confirmAction.imageUrl);
    removeImageMutation.mutate(
      { id: editingId, imageUrl: confirmAction.imageUrl },
      {
        onSettled: () => setConfirmAction(null),
      }
    );
  };

  const closeConfirmModal = () => {
    if (deleteMutation.isPending || removeImageMutation.isPending) return;
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-52 rounded-md bg-gray-200" />
          <div className="h-10 w-28 rounded-md bg-gray-200" />
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 h-5 w-28 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-md bg-gray-200" />
          </div>

          <div>
            <div className="mb-2 h-5 w-40 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-md bg-gray-200" />
          </div>

          <div>
            <div className="mb-2 h-5 w-44 rounded bg-gray-200" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 rounded-lg bg-gray-200" />
              <div className="h-32 rounded-lg bg-gray-200" />
              <div className="h-32 rounded-lg bg-gray-200" />
            </div>
          </div>

          <div>
            <div className="mb-2 h-5 w-64 rounded bg-gray-200" />
            <div className="h-[104px] w-full rounded-lg bg-gray-200" />
          </div>

          <div className="flex gap-4">
            <div className="h-12 w-44 rounded-lg bg-gray-200" />
            <div className="h-12 w-32 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {editingId ? "Edit Partners" : "Add Partners"}
        </h2>
        {editingId && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Trust by many
          </label>
          <Input
            type="text"
            name="excellent"
            value={formData.excellent}
            onChange={handleChange}
            placeholder="e.g. Trusted by 500+ companies"
            required
            className="h-[48px]"
          />
        </div>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Our Partners Title
          </label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Our Partners"
            required
            className="h-[48px]"
          />
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Current Partner Images
            </label>
            <div className="grid grid-cols-3 gap-4">
              {existingImages.map((img, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={img}
                    alt={`Partner ${index}`}
                    width={1000}
                    height={1000}
                    className="w-full h-32 object-contain border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    disabled={removeImageMutation.isPending && removingImageUrl === img}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={`Remove existing image ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tip: Click X on an image to remove it.
            </p>
          </div>
        )}

        {/* New Image Upload */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            {editingId ? "Upload New Partner Images (Adds to current list)" : "Upload Partner Images"}
          </label>
          <div className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, SVG (max 5MB each)</p>
            </div>
            <Input
              type="file"
              name="images"
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
              id="partner-images"
            />
            <label
              htmlFor="partner-images"
              className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
            >
              Choose Files
            </label>
          </div>

          {/* Preview newly selected files */}
          {formData.images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">New Images Selected:</p>
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((file, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`New ${index}`}
                      width={1000}
                      height={1000}
                      className="w-full h-32 object-contain border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            className="px-6 h-[48px] bg-[#FBFF26] text-lg text-[#2D3D4D] rounded-lg hover:bg-[#FBFF26]/95 transition-colors"
            disabled={mutation.isPending}
          >
            {mutation.isPending 
              ? (editingId ? "Updating..." : "Creating...") 
              : (editingId ? "Update Partners" : "Submit Partners")
            }
          </Button>

    
        </div>
      </form>
      </div>

      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && closeConfirmModal()}>
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
              {confirmAction?.type === "delete-partners"
                ? "You are about to delete this partners section."
                : "You are about to remove this image from partners."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={closeConfirmModal}
                disabled={deleteMutation.isPending || removeImageMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmAction}
                disabled={deleteMutation.isPending || removeImageMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteMutation.isPending
                  ? "Deleting..."
                  : removeImageMutation.isPending
                    ? "Removing..."
                    : confirmAction?.type === "delete-partners"
                      ? "Delete"
                      : "Remove"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export default PartnerForm;
