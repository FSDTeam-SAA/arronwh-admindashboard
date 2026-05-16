"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiEnvelope<T> = {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T[] | T | null;
};

type LogoItem = {
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

const getLogoEndpoint = () => {
  const base = getApiBase();
  return base ? `${base}/logo` : "/api/v1/logo";
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

const normalizeLogo = (payload: unknown): LogoItem | null => {
  const parsed = payload as ApiEnvelope<unknown>;
  const raw = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Partial<LogoItem>;
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

export default function UpdateLogoPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const logoEndpoint = useMemo(getLogoEndpoint, []);

  const logoQuery = useQuery({
    queryKey: ["logo", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(logoEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? "Failed to load logo.");
      }

      const logo = normalizeLogo(payload);
      if (!logo) {
        throw new Error("Logo data not found.");
      }

      return logo;
    },
  });

  useEffect(() => {
    if (!logoQuery.data) return;
    setCurrentImageUrl(logoQuery.data.image);
    setPreviewImageUrl(logoQuery.data.image);
    setSelectedImageFile(null);
    setFileInputKey((prev) => prev + 1);
  }, [logoQuery.data]);

  const updateLogoMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const logoId = logoQuery.data?._id;
      if (!logoId) {
        throw new Error("Logo ID not found.");
      }

      const payload = new FormData();
      payload.append("image", imageFile);

      const response = await fetch(`${logoEndpoint}/${logoId}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? "Failed to update logo.");
      }

      return result;
    },
    onSuccess: async (result) => {
      toast.success(getApiMessage(result) ?? "Logo updated successfully.");
      setSelectedImageFile(null);
      setFileInputKey((prev) => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ["logo", token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update logo.");
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
      toast.error("Please select a logo image first.");
      return;
    }

    updateLogoMutation.mutate(selectedImageFile);
  };

  const isPageLoading =
    status === "loading" || (status === "authenticated" && logoQuery.isLoading);

  if (status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage logo.
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="w-full rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm animate-pulse">
        <div className="mb-6 h-7 w-52 rounded-md bg-slate-200" />
        <div className="mb-5 h-48 w-full rounded-xl bg-slate-200" />
        <div className="mb-5 h-16 w-full rounded-xl bg-slate-200" />
        <div className="h-11 w-44 rounded-md bg-slate-200" />
      </div>
    );
  }

  if (logoQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {logoQuery.error instanceof Error ? logoQuery.error.message : "Failed to load logo."}
      </div>
    );
  }

  const isSubmitDisabled = updateLogoMutation.isPending || !selectedImageFile || !logoQuery.data?._id;

  return (
    <div className="w-full">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[#0F172A]">Update Website Logo</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Current logo is loaded from API. Select a new image and click update.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#0E7490]" />
              Logo Preview
            </Label>

            {previewImageUrl ? (
              <div className="relative h-52 w-full max-w-md overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-2">
                <Image
                  src={previewImageUrl}
                  alt="Website logo preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#64748B]">
                No logo found. Please upload a logo.
              </div>
            )}

            <p className="text-xs text-[#64748B]">
              Last updated: {formatDateTime(logoQuery.data?.updatedAt)}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="logoFile" className="text-sm font-medium text-[#0F172A]">
              Select New Logo
            </Label>
            <Input
              key={fileInputKey}
              id="logoFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="logoFile"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 transition hover:bg-[#F1F5F9]"
            >
              <UploadCloud className="h-6 w-6 text-[#0E7490]" />
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Click to choose logo image</p>
                <p className="text-xs text-[#64748B]">PNG, JPG, JPEG or WEBP</p>
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
                  disabled={updateLogoMutation.isPending}
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
              {updateLogoMutation.isPending ? "Updating..." : "Update Logo"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
