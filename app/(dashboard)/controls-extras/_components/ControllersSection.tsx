"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditControllerModal } from "./EditControllerModal";

type ControllerApiItem = {
  _id: string;
  title: string;
  description?: string;
  badges?: string[];
  price?: number;
  discount?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

type ControllerApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: ControllerApiItem[];
};

type ControllerItem = {
  id: string;
  title: string;
  description: string;
  price?: number;
  discount?: number;
  badges?: string[];
  images?: string[];
  priceLabel: string;
  image: string;
};

export function ControllersSection() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const authHeaders: HeadersInit | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ControllerItem | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ControllerItem | null>(null);
  const queryClient = useQueryClient();

  const controllerQuery = useQuery<ControllerApiResponse>({
    queryKey: ["controllers", token],
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/controller`, {
        headers: authHeaders,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load controllers.");
      }

      return data;
    },
  });

  const items = useMemo<ControllerItem[]>(() => {
    return (
      controllerQuery.data?.data?.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description ?? "",
        price: item.price,
        discount: item.discount,
        badges: item.badges ?? [],
        images: item.images ?? [],
        priceLabel:
          typeof item.price === "number"
            ? `£${item.price.toFixed(2)}`
            : "Included",
        image: item.images?.[0] ?? "/controller-1.png",
      })) ?? []
    );
  }, [controllerQuery.data]);

  const handleEditOpen = (controller: ControllerItem) => {
    setEditTarget(controller);
    setOpenEditModal(true);
  };

  const handleEditClose = (nextOpen: boolean) => {
    setOpenEditModal(nextOpen);
    if (!nextOpen) {
      setEditTarget(null);
    }
  };

  const handleDeleteOpen = (controller: ControllerItem) => {
    setDeleteTarget(controller);
    setOpenDeleteModal(true);
  };

  const handleDeleteClose = (nextOpen: boolean) => {
    setOpenDeleteModal(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const deleteControllerMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/controller/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure =
        data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to delete controller.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Controller deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["controllers", token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete controller."
      );
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteControllerMutation.mutate(deleteTarget.id);
  };

  const deleteLabel = deleteTarget?.title ?? "this controller";

  const content = controllerQuery.isLoading ? (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[425px] flex-col rounded-[4px] bg-white p-4 sm:p-5"
        >
          <div className="flex justify-center">
            <div className="h-[180px] w-full max-w-[250px] animate-pulse rounded-[8px] bg-[#E5E7EB]" />
          </div>

          <div className="mt-6 flex flex-1 flex-col">
            <div className="h-5 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded-[6px] bg-[#F0F3F6]" />
              <div className="h-4 w-5/6 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
            </div>
            <div className="mt-4 h-5 w-20 animate-pulse rounded-[6px] bg-[#E5E7EB]" />

            <div className="mt-auto flex items-center justify-center gap-4 pt-12">
              <div className="h-[36px] w-[140px] animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex min-h-[425px] flex-col rounded-[4px] bg-white p-4 sm:p-5"
        >
          <div className="flex justify-center">
            <div className="relative h-[180px] w-full max-w-[250px]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col">
            <h3 className="text-[18px] font-bold leading-7 text-[#2D3D4D]">
              {item.title}
            </h3>

            <div
              className="mt-3 text-[16px] leading-7 text-[#2D3D4D]"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />

            <p className="mt-3 text-[18px] font-bold text-[#2D3D4D]">
              {item.priceLabel}
            </p>

            <div className="mt-auto flex items-center justify-center gap-4 pt-12">
              <button
                type="button"
                onClick={() => handleEditOpen(item)}
                className="inline-flex h-[36px] items-center rounded-full bg-[#00A56F1A] px-4 text-[16px] font-medium text-[#12A150]"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={() => handleDeleteOpen(item)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
              >
                <Trash2 className="h-4 w-4 text-[#FFDE59]" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {!controllerQuery.isLoading && items.length === 0 && (
        <div className="col-span-full rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
          <p className="text-[16px] text-[#64748B]">
            No controllers added yet.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {content}
      <EditControllerModal
        open={openEditModal}
        onOpenChange={handleEditClose}
        controller={editTarget}
      />
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
                disabled={deleteControllerMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteControllerMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#F5D64E] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
              >
                {deleteControllerMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
