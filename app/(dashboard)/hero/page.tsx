"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
import { X, Plus } from "lucide-react";

type BannerItem = {
  _id: string;
  firstTitle: string;
  secondTitle: string;
  subTitle: string;
  feature: string[];
  image: string;
  imageText: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
};

type BannerApiResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: BannerItem[] | BannerItem;
};

type BannerFormState = {
  firstTitle: string;
  secondTitle: string;
  subTitle: string;
  feature: string[];
  imageText: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  imageFile: File | null;
};

const EMPTY_FORM: BannerFormState = {
  firstTitle: "",
  secondTitle: "",
  subTitle: "",
  feature: [],
  imageText: "",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  buttonText: "",
  imageFile: null,
};

const getBannerEndpoint = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/banner` : "/banner";
};

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const parsed = payload as BannerApiResponse;
  return parsed.success === false || parsed.status === false;
};

const isJsonLike = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("\"") && trimmed.endsWith("\""))
  );
};

const decodeFeatureValue = (value: unknown, depth = 0): string[] => {
  if (depth > 5 || value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => decodeFeatureValue(item, depth + 1));
  }

  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (isJsonLike(trimmed)) {
    try {
      return decodeFeatureValue(JSON.parse(trimmed), depth + 1);
    } catch {
      // Ignore parsing errors and continue with text clean-up fallback.
    }
  }

  const cleaned = trimmed
    .replace(/\\+/g, "")
    .replace(/^[\[\]{}"'`,;|]+|[\[\]{}"'`,;|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? [cleaned] : [];
};

const normalizeFeatureList = (value: unknown): string[] => {
  const seen = new Set<string>();
  return decodeFeatureValue(value).filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeBanners = (payload: unknown): BannerItem[] => {
  const parsed = payload as BannerApiResponse | BannerItem[] | null;
  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
      ? parsed.data
      : parsed?.data
        ? [parsed.data]
        : [];

  return rawList
    .map((item): BannerItem | null => {
      const id = String(item?._id ?? "").trim();
      if (!id) return null;

      return {
        _id: id,
        firstTitle: String(item.firstTitle ?? "").trim(),
        secondTitle: String(item.secondTitle ?? "").trim(),
        subTitle: String(item.subTitle ?? "").trim(),
        feature: normalizeFeatureList((item as { feature?: unknown }).feature),
        image: String(item.image ?? "").trim(),
        imageText: String(item.imageText ?? "").trim(),
        backgroundColor: String(item.backgroundColor ?? "#ffffff").trim() || "#ffffff",
        textColor: String(item.textColor ?? "#000000").trim() || "#000000",
        buttonText: String(item.buttonText ?? "").trim(),
      };
    })
    .filter((item): item is BannerItem => item !== null);
};

export default function HeroPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormState>(EMPTY_FORM);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [, setIsLoadingBanners] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  const [newFeature, setNewFeature] = useState("");

  const selectedBanner = useMemo(
    () => banners.find((item) => item._id === selectedBannerId) ?? null,
    [banners, selectedBannerId]
  );

  const fetchBanners = useCallback(
    async (preferredId?: string | null) => {
      setIsLoadingBanners(true);
      try {
        const response = await fetch(getBannerEndpoint(), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || hasExplicitFailure(result)) {
          throw new Error(
            (result as BannerApiResponse | null)?.message ?? "Failed to load banner data."
          );
        }

        const rows = normalizeBanners(result);
        setBanners(rows);
        setSelectedBannerId((prev) => {
          const candidate = preferredId ?? prev;
          if (candidate && rows.some((item) => item._id === candidate)) {
            return candidate;
          }
          return rows[0]?._id ?? null;
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load banner data."
        );
        setBanners([]);
        setSelectedBannerId(null);
      } finally {
        setIsLoadingBanners(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    if (!selectedBanner) {
      setFormData(EMPTY_FORM);
      setCurrentImageUrl("");
      setNewFeature("");
      return;
    }

    setFormData({
      firstTitle: selectedBanner.firstTitle,
      secondTitle: selectedBanner.secondTitle,
      subTitle: selectedBanner.subTitle,
      feature: [...selectedBanner.feature],
      imageText: selectedBanner.imageText,
      backgroundColor: selectedBanner.backgroundColor,
      textColor: selectedBanner.textColor,
      buttonText: selectedBanner.buttonText,
      imageFile: null,
    });
    setCurrentImageUrl(selectedBanner.image);
    setNewFeature("");
  }, [selectedBanner]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === "file") {
      const file = (event.target as HTMLInputElement).files?.[0] ?? null;
      setFormData((prev) => ({ ...prev, imageFile: file }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add Feature
  const addFeature = () => {
    const normalizedFeature = normalizeFeatureList(newFeature)[0] ?? "";
    const hasDuplicate = formData.feature.some(
      (feature) => feature.toLowerCase() === normalizedFeature.toLowerCase()
    );

    if (!normalizedFeature || hasDuplicate) {
      setNewFeature("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      feature: [...prev.feature, normalizedFeature],
    }));
    setNewFeature("");
  };

  // Remove Feature
  const removeFeature = (featureToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      feature: prev.feature.filter((f) => f !== featureToRemove),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBanner) {
      toast.error("Please select a banner first.");
      return;
    }

    setIsSaving(true);
    try {
      const normalizedFeatures = normalizeFeatureList(formData.feature);
      const payload = new FormData();
      payload.append("firstTitle", formData.firstTitle.trim());
      payload.append("secondTitle", formData.secondTitle.trim());
      payload.append("subTitle", formData.subTitle.trim());
      payload.append("feature", JSON.stringify(normalizedFeatures));
      payload.append("imageText", formData.imageText.trim());
      payload.append("backgroundColor", formData.backgroundColor.trim());
      payload.append("textColor", formData.textColor.trim());
      payload.append("buttonText", formData.buttonText.trim());

      if (formData.imageFile) {
        payload.append("image", formData.imageFile);
      }

      const response = await fetch(`${getBannerEndpoint()}/${selectedBanner._id}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(
          (result as BannerApiResponse | null)?.message ?? "Failed to update banner."
        );
      }

      toast.success("Banner updated successfully.");
      await fetchBanners(selectedBanner._id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update banner."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // const handleDelete = async () => {
  //   if (!selectedBanner) {
  //     toast.error("Please select a banner first.");
  //     return;
  //   }

  //   if (!window.confirm("Delete this banner?")) return;

  //   setIsDeleting(true);
  //   try {
  //     const response = await fetch(`${getBannerEndpoint()}/${selectedBanner._id}`, {
  //       method: "DELETE",
  //       headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  //     });
  //     const result = await response.json().catch(() => null);

  //     if (!response.ok || hasExplicitFailure(result)) {
  //       throw new Error(
  //         (result as BannerApiResponse | null)?.message ?? "Failed to delete banner."
  //       );
  //     }

  //     toast.success("Banner deleted successfully.");
  //     await fetchBanners();
  //   } catch (error) {
  //     toast.error(
  //       error instanceof Error ? error.message : "Failed to delete banner."
  //     );
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold">Edit Banner</h2>

      {!selectedBanner ? (
        <p className="text-sm text-gray-500">Select a banner to edit.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">First Title</Label>
            <Input
              name="firstTitle"
              value={formData.firstTitle}
              onChange={handleChange}
              required
              className="mt-1.5 h-12 text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Second Title</Label>
            <Input
              name="secondTitle"
              value={formData.secondTitle}
              onChange={handleChange}
              required
              className="mt-1.5 h-12 text-lg font-normal text-[#1E1E1E]"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Sub Title</Label>
            <Input
              name="subTitle"
              value={formData.subTitle}
              onChange={handleChange}
              className="mt-1.5 h-12"
            />
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Button Text</Label>
            <Input
              name="buttonText"
              value={formData.buttonText}
              onChange={handleChange}
              className="mt-1.5 h-12"
            />
          </div>

          {/* Features Tag System */}
          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Features</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Type feature and press Enter or click +"
                className="h-12 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" onClick={addFeature} className="h-12 px-5">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {formData.feature.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-[#F8F9FA] border border-gray-200 text-[#2D3D4D] px-4 py-2 rounded-full text-sm font-medium"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.feature.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No features added yet.</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Banner Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="mt-1.5 h-12"
            />
            {currentImageUrl && (
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src={currentImageUrl}
                  alt={formData.imageText || "Current banner image"}
                  width={112}
                  height={64}
                  className="h-16 w-28 rounded border object-cover"
                />
                <p className="text-xs text-gray-500">
                  Current image. Upload new file only if you want to replace it.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Image Text / Overlay</Label>
            <Input
              name="imageText"
              value={formData.imageText}
              onChange={handleChange}
              className="mt-1.5 h-12"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-lg font-normal text-[#2D3D4D]">Background Color</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleChange}
                  className="h-12 w-20 p-1"
                />
                <Input
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleChange}
                  className="h-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-lg font-normal text-[#2D3D4D]">Text Color</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  type="color"
                  name="textColor"
                  value={formData.textColor}
                  onChange={handleChange}
                  className="h-12 w-20 p-1"
                />
                <Input
                  name="textColor"
                  value={formData.textColor}
                  onChange={handleChange}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#FBFF26] text-[#1E1E1E] hover:bg-[#FFDE59]/90 text-base h-[48px]"
            >
              {isSaving ? "Saving..." : "Update Banner"}
            </Button>
            {/* <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[red] h-[48px] px-6 text-base text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button> */}
          </div>
        </form>
      )}
    </div>
  );
}
