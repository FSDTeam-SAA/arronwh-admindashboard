"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiEnvelope<T> = {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T[] | T | null;
};

type FaviconItem = {
  _id: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

const getApiBase = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "").replace(
    /\/+$/,
    ""
  );

const getFaviconEndpoint = () => {
  const base = getApiBase();
  if (!base) return "/api/v1/favicon";
  return base.endsWith("/api/v1") ? `${base}/favicon` : `${base}/api/v1/favicon`;
};

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const parsed = payload as ApiEnvelope<unknown>;
  return parsed.success === false || parsed.status === false;
};

const getApiMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;
  const parsed = payload as ApiEnvelope<unknown>;
  return typeof parsed.message === "string" && parsed.message.trim()
    ? parsed.message.trim()
    : null;
};

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeFavicon = (payload: unknown): FaviconItem | null => {
  const parsed = payload as ApiEnvelope<unknown>;
  const raw = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<FaviconItem>;
  const id = readString(item._id);
  if (!id) return null;

  return {
    _id: id,
    image: readString(item.image),
    createdAt: readString(item.createdAt),
    updatedAt: readString(item.updatedAt),
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

export default function UpdateFaviconPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const faviconEndpoint = useMemo(getFaviconEndpoint, []);

  const faviconQuery = useQuery({
    queryKey: ["favicon", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(faviconEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? "Failed to load favicon.");
      }

      const favicon = normalizeFavicon(payload);
      if (!favicon) {
        throw new Error("Favicon data not found.");
      }

      return favicon;
    },
  });

  useEffect(() => {
    if (!faviconQuery.data) return;
    setCurrentImageUrl(faviconQuery.data.image);
    setPreviewImageUrl(faviconQuery.data.image);
    setSelectedImageFile(null);
    setFileInputKey((prev) => prev + 1);
  }, [faviconQuery.data]);

  const updateFaviconMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const faviconId = faviconQuery.data?._id;
      if (!faviconId) {
        throw new Error("Favicon ID not found.");
      }

      const payload = new FormData();
      payload.append("image", imageFile);

      const response = await fetch(`${faviconEndpoint}/${faviconId}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? "Failed to update favicon.");
      }

      return result;
    },
    onSuccess: async (result) => {
      toast.success(getApiMessage(result) ?? "Favicon updated successfully.");
      setSelectedImageFile(null);
      setFileInputKey((prev) => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ["favicon", token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update favicon.");
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImageFile(file);

    if (!file) {
      setPreviewImageUrl(currentImageUrl);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPreviewImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setPreviewImageUrl(currentImageUrl);
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedImageFile) {
      toast.error("Please select a favicon image first.");
      return;
    }

    updateFaviconMutation.mutate(selectedImageFile);
  };

  const isPageLoading =
    status === "loading" || (status === "authenticated" && faviconQuery.isLoading);

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage favicon.
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm animate-pulse">
        <div className="mb-6 h-7 w-56 rounded-md bg-slate-200" />
        <div className="mb-5 h-48 w-full rounded-xl bg-slate-200" />
        <div className="mb-5 h-16 w-full rounded-xl bg-slate-200" />
        <div className="h-11 w-48 rounded-md bg-slate-200" />
      </div>
    );
  }

  if (faviconQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {faviconQuery.error instanceof Error ? faviconQuery.error.message : "Failed to load favicon."}
      </div>
    );
  }

  const isSubmitDisabled =
    updateFaviconMutation.isPending || !selectedImageFile || !faviconQuery.data?._id;

  return (
    <div className="w-full">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[#0F172A]">Update Website Favicon</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Current favicon is loaded from API. Select a new image and click update.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#0E7490]" />
              Favicon Preview
            </Label>

            {previewImageUrl ? (
              <div className="flex w-full max-w-md items-center gap-5 rounded-xl border border-[#E2E8F0] bg-white p-5">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <Image
                    src={previewImageUrl}
                    alt="Website favicon preview"
                    fill
                    sizes="112px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">Browser tab icon preview</p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Upload a square PNG, JPG, JPEG, WEBP or ICO image for best result.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#64748B]">
                No favicon found. Please upload a favicon.
              </div>
            )}

            <p className="text-xs text-[#64748B]">
              Last updated: {formatDateTime(faviconQuery.data?.updatedAt)}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="faviconFile" className="text-sm font-medium text-[#0F172A]">
              Select New Favicon
            </Label>
            <Input
              key={fileInputKey}
              id="faviconFile"
              type="file"
              accept="image/*,.ico"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="faviconFile"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 transition hover:bg-[#F1F5F9]"
            >
              <UploadCloud className="h-6 w-6 text-[#0E7490]" />
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Click to choose favicon image</p>
                <p className="text-xs text-[#64748B]">PNG, JPG, JPEG, WEBP or ICO</p>
              </div>
            </label>

            {selectedImageFile && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-[#334155]">
                  Selected: <span className="font-medium">{selectedImageFile.name}</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSelectedImage}
                  disabled={updateFaviconMutation.isPending}
                  className="h-9 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="h-11 bg-[#FBFF26] px-6 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {updateFaviconMutation.isPending ? "Updating..." : "Update Favicon"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
