"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type ReviewItem = {
  id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  isActive: boolean;
};

interface EditReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewItem: ReviewItem | null;
}

export function EditReviewModal({
  open,
  onOpenChange,
  reviewItem,
}: EditReviewModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  useEffect(() => {
    if (reviewItem) {
      setName(reviewItem.name);
      setLocation(reviewItem.location);
      setReview(reviewItem.review);
      setRating(String(reviewItem.rating));
      setIsActive(reviewItem.isActive);
    }
  }, [reviewItem]);

  const updateReviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewItem) throw new Error("Review not selected.");

      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
      const response = await fetch(`${apiBase}/customersay/${reviewItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          review: review.trim(),
          rating: Number(rating),
          isActive,
        }),
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;
      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to update review.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Review updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["reviews", token] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update review.");
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !location.trim() || !review.trim()) {
      toast.error("Name, location and review are required.");
      return;
    }
    const ratingNumber = Number(rating);
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }
    updateReviewMutation.mutate();
  };

  const handleClose = () => {
    if (!updateReviewMutation.isPending) {
      onOpenChange(false);
    }
  };

  if (!reviewItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />
        <DialogContent className="max-h-[92vh] !w-[900px] max-w-[96vw] gap-0 overflow-hidden rounded-[16px] border-none bg-white p-0">
          <div className="px-6 pb-6 pt-7 sm:px-7">
            <DialogTitle className="mb-6 text-[24px] font-bold text-[#2D3D4D]">
              Edit Review
            </DialogTitle>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  Customer Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  Review
                </label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="min-h-[120px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                    Rating (1-5)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                    Status
                  </label>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(e) => setIsActive(e.target.value === "active")}
                    className="h-[48px] w-full rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateReviewMutation.isPending}
                  className="h-[48px] rounded-[8px] border border-[#F5D64E] bg-transparent text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={updateReviewMutation.isPending}
                  className="h-[48px] rounded-[8px] bg-[#FBFF26] text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                >
                  {updateReviewMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
