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

const normalizeBadges = (badges: unknown): string[] => {
  const fromMaybeJsonArray = (value: string): string[] | null => {
    const trimmed = value.trim();
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return null;
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return null;
    }
  };

  if (typeof badges === "string") {
    const parsed = fromMaybeJsonArray(badges);
    if (parsed) return parsed;
    const trimmed = badges.trim();
    return trimmed ? [trimmed] : [];
  }

  if (!Array.isArray(badges)) return [];

  const normalized = badges.flatMap((badge) => {
    if (typeof badge !== "string") return [];
    const parsed = fromMaybeJsonArray(badge);
    if (parsed) return parsed;
    const trimmed = badge.trim();
    return trimmed ? [trimmed] : [];
  });

  return Array.from(new Set(normalized));
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

export type EditableExtra = {
  id: string;
  title: string;
  description: string;
  price?: number;
  discount?: number;
  badges?: string[];
  images?: string[];
};

interface EditExtraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extra: EditableExtra | null;
}

export function EditExtraModal({
  open,
  onOpenChange,
  extra,
}: EditExtraModalProps) {
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const labelPrefix = "Extras";
  const modalTitle = "Edit Extra";

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
    setExistingImages([]);
  };

  useEffect(() => {
    if (!open) {
      handleReset();
      return;
    }

    if (extra) {
      setTitle(extra.title ?? "");
      setDescription(extra.description ?? "");
      setPrice(
        extra.price !== undefined && extra.price !== null
          ? String(extra.price)
          : ""
      );
      setDiscount(
        extra.discount !== undefined && extra.discount !== null
          ? String(extra.discount)
          : ""
      );
      const incomingBadges = normalizeBadges(extra.badges);
      const presetBadgeLabels = new Set(
        badgeOptions.map((badge) => badge.label)
      );
      setSelectedBadges(incomingBadges);
      setCustomBadges(
        incomingBadges.filter((badge) => !presetBadgeLabels.has(badge))
      );
      setShowAddBadgeInput(false);
      setNewBadge("");
      setIsEditingBadges(false);
      setFiles([]);
      setExistingImages(extra.images ?? []);
    }
  }, [open, extra]);

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

  const updateExtraMutation = useMutation({
    mutationFn: async (id: string) => {
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
      if (files.length > 0) {
        files.forEach((file) => formData.append("images", file));
      }

      const response = await fetch(`${apiBase}/extra/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to update extra.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Extra updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["extras", token] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update extra."
      );
    },
  });

  const handleSubmit = () => {
    if (!extra) return;
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    updateExtraMutation.mutate(extra.id);
  };

  if (!extra) return null;

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
                      className="h-[32px] rounded-[8px] bg-[#FBFF26] px-4 text-[12px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95"
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
                            onChange={(event) => {
                              handleEditBadge(index, event.target.value);
                            }}
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

                {existingImages.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    {existingImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative h-[52px] w-[52px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

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
                  htmlFor="extras-edit-upload"
                  className="mt-3 flex h-[90px] w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#D9E0E7] bg-[#F8FAFC] text-[12px] font-medium text-[#64748B]"
                >
                  <UploadCloud className="mb-2 h-5 w-5 text-[#94A3B8]" />
                  Upload image
                </label>
                <input
                  id="extras-edit-upload"
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
                  disabled={updateExtraMutation.isPending}
                  className="h-[46px] rounded-[10px] border border-[#F5D64E] bg-transparent text-[14px] font-semibold text-[#F5C842] hover:bg-transparent"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={updateExtraMutation.isPending}
                  className="h-[46px] rounded-[10px] bg-[#FBFF26] text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updateExtraMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
