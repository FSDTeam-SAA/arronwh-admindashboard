"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CircleX, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type BadgeOption = {
  id: string;
  label: string;
};

const badgeOptions: BadgeOption[] = [
  { id: "best-seller", label: "OUR BEST SELLER" },
  { id: "quiet-mark", label: "Quiet Mark" },
  { id: "latest-model", label: "Latest Model" },
  { id: "popular-model", label: "Popular Model" },
  { id: "finance", label: "0% finance" },
];

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "indent",
  "align",
];

interface AddExtraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExtraModal({ open, onOpenChange }: AddExtraModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [customBadges, setCustomBadges] = useState<string[]>([]);
  const [showAddBadgeInput, setShowAddBadgeInput] = useState(false);
  const [newBadge, setNewBadge] = useState("");
  const [isEditingBadges, setIsEditingBadges] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const labelPrefix = "Extras";
  const modalTitle = "Add New Extras";

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  const allBadges = useMemo(
    () => [...badgeOptions.map((badge) => badge.label), ...customBadges],
    [customBadges]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleToggleBadge = (label: string) => {
    setSelectedBadges((prev) =>
      prev.includes(label)
        ? prev.filter((badge) => badge !== label)
        : [...prev, label]
    );
  };

  const handleAddBadge = () => {
    const trimmed = newBadge.trim();
    if (!trimmed) return;
    if (!customBadges.includes(trimmed)) {
      setCustomBadges((prev) => [...prev, trimmed]);
    }
    if (!selectedBadges.includes(trimmed)) {
      setSelectedBadges((prev) => [...prev, trimmed]);
    }
    setNewBadge("");
    setShowAddBadgeInput(false);
  };

  const handleRemoveBadge = (badge: string) => {
    setSelectedBadges((prev) => prev.filter((item) => item !== badge));
    setCustomBadges((prev) => prev.filter((item) => item !== badge));
  };

  const handleEditBadge = (index: number, nextValue: string) => {
    const trimmed = nextValue.trim();
    const current = selectedBadges[index];
    setSelectedBadges((prev) =>
      prev.map((item, idx) => (idx === index ? trimmed : item))
    );
    setCustomBadges((prev) => {
      if (!prev.includes(current)) return prev;
      return prev.map((item) => (item === current ? trimmed : item));
    });
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (nextFiles.length === 0) return;
    setFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setDiscount("");
    setSelectedBadges([]);
    setCustomBadges([]);
    setShowAddBadgeInput(false);
    setNewBadge("");
    setIsEditingBadges(false);
    setFiles([]);
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const createExtraMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description);
      if (price.trim()) {
        formData.append("price", price.trim());
      }
      if (discount.trim()) {
        formData.append("discount", discount.trim());
      }
      if (selectedBadges.length > 0) {
        formData.append("badges", JSON.stringify(selectedBadges));
      }
      files.forEach((file) => formData.append("images", file));

      const response = await fetch(`${apiBase}/extra`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to add extra.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Extra added successfully.");
      queryClient.invalidateQueries({ queryKey: ["extras", token] });
      onOpenChange(false);
      handleReset();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add extra.");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    createExtraMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[1000px] max-w-[96vw] sm:max-w-[96vw] overflow-hidden rounded-[18px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          <div className="max-h-[92vh] overflow-y-auto px-6 pb-6 pt-6 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <DialogTitle className="text-[24px] font-semibold text-[#2D3D4D] sm:text-[28px]">
                {modalTitle}
              </DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD5E1] text-[#2D3D4D] transition hover:bg-[#F8FAFC]"
              >
                <CircleX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2D3D4D]">
                  {labelPrefix} Title
                </label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Type your title..."
                  className="h-[48px] rounded-[12px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d7dfe7]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2D3D4D]">
                  {labelPrefix} Description
                </label>
                <div className="quill-editor overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-sm">
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Type boiler description..."
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[16px] font-semibold text-[#2D3D4D]">
                    Add Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddBadgeInput(true)}
                      className="h-[32px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[12px] font-semibold text-[#F5C842] hover:bg-transparent"
                    >
                      Add more badge
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsEditingBadges((prev) => !prev)}
                      className="h-[32px] rounded-[8px] bg-[#F5D64E] px-4 text-[12px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
                    >
                      {isEditingBadges ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                {showAddBadgeInput && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={newBadge}
                      onChange={(event) => setNewBadge(event.target.value)}
                      placeholder="Type badge name..."
                      className="h-[34px] max-w-[240px] rounded-[8px] border-0 bg-[#F4F7F9] px-3 text-[12px] text-[#2D3D4D] placeholder:text-[#9CA3AF]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddBadge}
                      className="h-[34px] rounded-[8px] bg-[#00A56F] px-4 text-[12px] font-semibold text-white hover:bg-[#009562]"
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {allBadges.map((label) => {
                    const isActive = selectedBadges.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleToggleBadge(label)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[12px] font-semibold transition",
                          isActive
                            ? "border-[#00A56F] bg-[#E4F7EF] text-[#00A56F]"
                            : "border-[#E5E7EB] bg-white text-[#2D3D4D]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-3 w-3 rounded-[4px] border",
                            isActive
                              ? "border-[#00A56F] bg-[#00A56F]"
                              : "border-[#CBD5E1] bg-white"
                          )}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {selectedBadges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedBadges.map((badge, index) => (
                      <div
                        key={`${badge}-${index}`}
                        className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-semibold text-[#2D3D4D]"
                      >
                        {isEditingBadges ? (
                          <input
                            value={badge}
                            onChange={(event) =>
                              handleEditBadge(index, event.target.value)
                            }
                            className="w-[120px] bg-transparent text-[12px] outline-none"
                          />
                        ) : (
                          <span>{badge}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveBadge(badge)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <CircleX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2D3D4D]">
                  {labelPrefix} Price
                </label>
                <Input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Type boiler price..."
                  className="h-[48px] rounded-[12px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d7dfe7]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2D3D4D]">
                  Enter Discount in this {labelPrefix}
                </label>
                <Input
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  placeholder="Type your discount price..."
                  className="h-[48px] rounded-[12px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d7dfe7]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-[#2D3D4D]">
                  Upload {labelPrefix} images
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {previewUrls.map((url, index) => (
                    <div
                      key={url}
                      className="relative h-[52px] w-[52px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="52px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                      >
                        <CircleX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <label
                  htmlFor="extras-upload"
                  className="mt-3 flex h-[90px] w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#D9E0E7] bg-[#F8FAFC] text-[12px] font-medium text-[#64748B]"
                >
                  <UploadCloud className="mb-2 h-5 w-5 text-[#94A3B8]" />
                  Upload image
                </label>
                <input
                  id="extras-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createExtraMutation.isPending}
                  className="h-[46px] rounded-[10px] border border-[#F5D64E] bg-transparent text-[14px] font-semibold text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createExtraMutation.isPending}
                  className="h-[46px] rounded-[10px] bg-[#F5D64E] text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createExtraMutation.isPending ? "Saving..." : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
