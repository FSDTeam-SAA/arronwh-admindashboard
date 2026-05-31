"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AddReviewModal } from "./_components/AddReviewModal";
import { EditReviewModal } from "./_components/EditReviewModal";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

type ReviewApiItem = {
  _id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  video?: string;
  isActive?: boolean;
};

type ReviewsApiResponse = {
  data: ReviewApiItem[];
};

type ReviewItem = {
  id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  video?: string;
  isActive: boolean;
};

export default function ReviewsManagementPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);

  const reviewsQuery = useQuery<ReviewsApiResponse>({
    queryKey: ["reviews", token],
    queryFn: async () => {
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
      const response = await fetch(`${apiBase}/review?sortBy=createdAt&sortOrder=desc&limit=200&page=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;
      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load reviews.");
      }
      return data;
    },
  });

  const reviews = useMemo<ReviewItem[]>(() => {
    return (
      reviewsQuery.data?.data?.map((item) => ({
        id: item._id,
        name: item.name,
        location: item.location,
        review: item.review,
        rating: item.rating,
        video: item.video,
        isActive: item.isActive !== false,
      })) ?? []
    );
  }, [reviewsQuery.data]);

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
      const response = await fetch(`${apiBase}/review/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;
      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to delete review.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Review deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["reviews", token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete review.");
    },
  });

  const handleEditOpen = (item: ReviewItem) => {
    setSelectedReview(item);
    setOpenEditModal(true);
  };

  const handleDeleteOpen = (item: ReviewItem) => {
    setDeleteTarget(item);
    setOpenDeleteModal(true);
  };

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
                Reviews Management
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
                <Link href="/" className="transition hover:text-[#00A56F]">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span>Reviews Management</span>
              </div>
            </div>

            <Button
              onClick={() => setOpenAddModal(true)}
              className="h-[44px] rounded-[6px] bg-[#FBFF26] px-5 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Review
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {reviewsQuery.isLoading &&
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="rounded-[10px] bg-white p-5">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#F0F3F6]" />
                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[#F0F3F6]" />
                </div>
              ))}

            {reviewsQuery.isError && (
              <div className="rounded-[12px] border border-dashed border-red-200 bg-white p-8 text-center">
                <p className="text-[16px] text-red-500">
                  {reviewsQuery.error instanceof Error
                    ? reviewsQuery.error.message
                    : "Failed to load reviews."}
                </p>
              </div>
            )}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
              <div className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
                <p className="text-[16px] text-[#64748B]">No reviews added yet.</p>
              </div>
            )}

            {!reviewsQuery.isLoading &&
              !reviewsQuery.isError &&
              reviews.map((item) => (
                <div key={item.id} className="rounded-[10px] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[20px] font-bold text-[#2D3D4D]">{item.name}</h2>
                        <span className="text-[13px] text-[#64748B]">({item.location})</span>
                        <span
                          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                            item.isActive ? "bg-[#E8F8F1] text-[#0F9D58]" : "bg-[#FCE8E8] text-[#D93025]"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {!item.video && (
                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`h-4 w-4 ${
                                starIndex < item.rating
                                  ? "fill-[#00A56F] text-[#00A56F]"
                                  : "fill-[#CFD6DD] text-[#CFD6DD]"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <p className="mt-3 text-[15px] leading-7 text-[#2D3D4D]">{item.review}</p>

                      {item.video && (
                        <video
                          controls
                          className="mt-4 h-[150px] w-full max-w-[420px] rounded-[10px] border border-[#E2E8F0] object-cover"
                          src={item.video}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditOpen(item)}
                        className="inline-flex h-[34px] items-center rounded-full bg-[#00A56F1A] px-4 text-[14px] font-medium text-[#12A150]"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOpen(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <AddReviewModal open={openAddModal} onOpenChange={setOpenAddModal} />

      <EditReviewModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        reviewItem={selectedReview}
      />

      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />
          <DialogContent className="w-[420px] max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Are you sure?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You want to delete review of {deleteTarget?.name ?? "this customer"}.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDeleteModal(false)}
                className="h-[42px] rounded-[8px] border-[#CBD5E1] text-[#475569]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => deleteTarget && deleteReviewMutation.mutate(deleteTarget.id)}
                disabled={deleteReviewMutation.isPending}
                className="h-[42px] rounded-[8px] bg-[#EF4444] text-white hover:bg-[#DC2626]"
              >
                {deleteReviewMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
