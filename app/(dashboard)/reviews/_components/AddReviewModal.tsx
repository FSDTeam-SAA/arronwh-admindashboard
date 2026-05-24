"use client";

import { useEffect, useRef, useState } from "react";
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

interface AddReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiErrorSource = {
  path?: string;
  message?: string;
};

type ApiErrorResponse = {
  message?: string;
  errorSources?: ApiErrorSource[];
};

const getApiErrorMessage = (data: ApiErrorResponse | null, fallback: string) => {
  if (Array.isArray(data?.errorSources) && data.errorSources.length > 0) {
    return data.errorSources
      .map((item) => item?.message || item?.path)
      .filter(Boolean)
      .join(" ");
  }
  return data?.message || fallback;
};

export function AddReviewModal({ open, onOpenChange }: AddReviewModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("location", location.trim());
      formData.append("review", review.trim());
      formData.append("rating", String(Number(rating)));
      formData.append("isActive", String(isActive));
      if (videoFile) {
        formData.append("video", videoFile);
      }

      const response = await fetch(`${apiBase}/review`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;
      if (!response.ok || hasExplicitFailure) {
        throw new Error(getApiErrorMessage(data, "Failed to add review."));
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Review added successfully.");
      queryClient.invalidateQueries({ queryKey: ["reviews", token] });
      setName("");
      setLocation("");
      setReview("");
      setRating("5");
      setIsActive(true);
      setVideoFile(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add review.");
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !location.trim()) {
      toast.error("Customer Name and Location are required.");
      return;
    }

    const ratingNumber = Number(rating);
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }

    createReviewMutation.mutate();
  };

  const handleClose = () => {
    if (!createReviewMutation.isPending) {
      onOpenChange(false);
    }
  };

  const handleClearVideoPreview = () => {
    setVideoFile(null);
    setVideoPreviewUrl("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />
        <DialogContent className="max-h-[92vh] !w-[900px] !max-w-[600px] gap-0 overflow-hidden rounded-[16px] border-none bg-white p-0">
          <div className="px-6 pb-6 pt-7 sm:px-7">
            <DialogTitle className="mb-6 text-[24px] font-bold text-[#2D3D4D]">
              Add New Review
            </DialogTitle>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Type customer name..."
                    className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Type location..."
                    className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  Review
                </label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Type review..."
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
                  <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">Status</label>
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

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#2D3D4D]">
                  Video
                </label>
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="h-[48px] rounded-[10px] border-0 bg-[#F4F7F9] file:mr-4 file:rounded-md file:border-0 file:bg-[#E9EEF2] file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-[#2D3D4D]"
                />
                {videoPreviewUrl && (
                  <div className="relative mt-3">
                    <button
                      type="button"
                      onClick={handleClearVideoPreview}
                      className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                    >
                      ✕
                    </button>
                    <video
                      controls
                      className="h-[150px] w-full rounded-[10px] border border-[#E2E8F0] object-cover"
                      src={videoPreviewUrl}
                    />
                  </div>
                )}
                <p className="mt-2 text-[12px] text-[#64748B]">
                  Required fields are marked with <span className="text-red-500">*</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createReviewMutation.isPending}
                  className="h-[48px] rounded-[8px] border border-[#F5D64E] bg-transparent text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createReviewMutation.isPending}
                  className="h-[48px] rounded-[8px] bg-[#FBFF26] text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                >
                  {createReviewMutation.isPending ? "Saving..." : "Add Review"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
