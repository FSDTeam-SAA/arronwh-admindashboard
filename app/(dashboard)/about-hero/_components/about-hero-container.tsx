"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

type AboutUsItem = {
  _id: string;
  headerTitle: string;
  headerDescription: string;
  title: string;
  description: string;
  images: string[];
};

interface ApiNestedData {
  _id?: string;
  headerTitle?: string;
  headerDescription?: string;
  title?: string;
  description?: string;
  images?: string[];
  [key: string]: unknown;
}

interface ApiResponseWrapper {
  success?: boolean;
  data?: ApiNestedData | { success?: boolean; data?: ApiNestedData };
}

type AboutUsApiResponse = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: ApiResponseWrapper | ApiNestedData;
};

type AboutUsFormState = {
  headerTitle: string;
  headerDescription: string;
  title: string;
  description: string;
  imageFile: File | null;
};

const EMPTY_FORM: AboutUsFormState = {
  headerTitle: "",
  headerDescription: "",
  title: "",
  description: "",
  imageFile: null,
};

const ABOUT_US_ID = "69fef08fa5468bfda7d2dd63";

const getAboutUsEndpoint = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/aboutus` : "/aboutus";
};

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const parsed = payload as AboutUsApiResponse;
  return parsed.success === false;
};

const normalizeAboutUsItem = (payload: unknown): AboutUsItem | null => {
  if (!payload || typeof payload !== "object") return null;
  
  const response = payload as AboutUsApiResponse;
  
  // Let's try a safer way without any:
  let item: ApiNestedData | undefined;
  
  const rawData = response.data;
  if (rawData && typeof rawData === "object") {
    if ("_id" in rawData) {
      item = rawData as ApiNestedData;
    } else if ("data" in rawData) {
      const innerData = (rawData as { data: unknown }).data;
      if (innerData && typeof innerData === "object") {
        if ("_id" in innerData) {
          item = innerData as ApiNestedData;
        }
      }
    }
  }

  if (!item || !item._id) return null;

  return {
    _id: String(item._id).trim(),
    headerTitle: String(item.headerTitle ?? "").trim(),
    headerDescription: String(item.headerDescription ?? "").trim(),
    title: String(item.title ?? "").trim(),
    description: String(item.description ?? "").trim(),
    images: Array.isArray(item.images)
      ? item.images
          .map((img: unknown) => String(img ?? "").trim())
          .filter((img: string) => img && img !== "string")
      : [],
  };
};

export default function AboutHeroContainer() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [aboutUsData, setAboutUsData] = useState<AboutUsItem | null>(null);
  const [formData, setFormData] = useState<AboutUsFormState>(EMPTY_FORM);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAboutUs = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${getAboutUsEndpoint()}/${ABOUT_US_ID}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const result = (await response.json().catch(() => null)) as unknown;

        if (!response.ok || hasExplicitFailure(result)) {
          const errorPayload = result as AboutUsApiResponse | null;
          throw new Error(
            errorPayload?.message ?? "Failed to load about us data."
          );
        }

        const normalized = normalizeAboutUsItem(result);
        if (normalized) {
          setAboutUsData(normalized);
          setFormData({
            headerTitle: normalized.headerTitle,
            headerDescription: normalized.headerDescription,
            title: normalized.title,
            description: normalized.description,
            imageFile: null,
          });
          setCurrentImages([...normalized.images]);
        } else {
          throw new Error("Invalid data format received from server.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load about us data."
        );
        setAboutUsData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void fetchAboutUs();
  }, [fetchAboutUs]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === "file") {
      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files?.[0] ?? null;
      
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
      
      if (file) {
        setNewImagePreview(URL.createObjectURL(file));
      } else {
        setNewImagePreview(null);
      }

      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeCurrentImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!aboutUsData) {
      toast.error("No about us data to update.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("headerTitle", formData.headerTitle.trim());
      payload.append("headerDescription", formData.headerDescription.trim());
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());

      if (formData.imageFile) {
        payload.append("images", formData.imageFile);
      }

      const response = await fetch(`${getAboutUsEndpoint()}/${ABOUT_US_ID}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || hasExplicitFailure(result)) {
        const errorPayload = result as AboutUsApiResponse | null;
        throw new Error(
          errorPayload?.message ?? "Failed to update about us."
        );
      }

      toast.success("About Us updated successfully.");
      await fetchAboutUs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update about us."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading About Us data...</div>;
  }

  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold">Edit About Us Hero</h2>

      {!aboutUsData ? (
        <p className="text-sm text-gray-500">Failed to load content. Please refresh.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Header Title</Label>
            <Input
              name="headerTitle"
              value={formData.headerTitle}
              onChange={handleChange}
              required
              className="mt-1.5 h-12 text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Header Description</Label>
            <Textarea
              name="headerDescription"
              value={formData.headerDescription}
              onChange={handleChange}
              required
              className="mt-1.5 min-h-[100px] text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Title</Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1.5 h-12 text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Description</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1.5 min-h-[120px] text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          {/* Current Images */}
          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Current Images</Label>
            {currentImages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-3">
                {currentImages.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={imgUrl}
                      alt={`About us image ${index + 1}`}
                      width={160}
                      height={100}
                      className="h-24 w-40 rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeCurrentImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">No images currently set.</p>
            )}
          </div>

          {/* Upload New Image */}
          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Upload New Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="mt-1.5 h-12"
            />
            {formData.imageFile && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2 bg-[#F8F9FA] border border-gray-200 text-[#2D3D4D] px-3 py-1.5 rounded-full text-sm w-fit">
                  {formData.imageFile.name}
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {newImagePreview && (
                  <div className="relative w-fit group">
                    <Image
                      src={newImagePreview}
                      alt="New image preview"
                      width={160}
                      height={100}
                      className="h-24 w-40 rounded-lg border object-cover ring-2 ring-[#FBFF26]"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                       <p className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Selected File</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Upload a new image only if you want to replace the current ones.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#FBFF26] text-[#1E1E1E] hover:bg-[#FFDE59]/90 text-base h-[48px]"
            >
              {isSaving ? "Saving..." : "Update About Us Hero"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
