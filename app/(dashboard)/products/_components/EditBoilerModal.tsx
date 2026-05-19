"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Plus, SquarePen } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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

const DEFAULT_BADGES = [
  "OUR BEST SELLER",
  "Quiet Mark",
  "Latest Model",
  "Popular Model",
  "0% finance",
];

const isValidImageSrc = (src?: string) => {
  if (!src) return false;
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
};

type ProductEditData = {
  _id: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  badges?: string[];
  price?: number;
  discountPrice?: number;
  payablePrice?: number;
  monthlyPrice?: number;
  boilerAbility?: string;
  boilerFeatures?: Array<
    { title?: string; value?: string; details?: string; warranty?: string } | string
  >;
  featureInformation?: {
    featureTitle?: string;
    featureDescription?: string;
    featureLogo?: string[];
  };
  boilerIncludedData?: string;
  alsoUseData?: string;
  includedImages?: string[];
  boilerInstallationGuide?: Array<{ title?: string; image?: string }>;
};

interface EditBoilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductEditData | null;
}

const resolveAccessToken = (sessionData: unknown): string | undefined => {
  if (!sessionData || typeof sessionData !== "object") return undefined;

  const sessionObject = sessionData as Record<string, unknown>;
  if (typeof sessionObject.accessToken === "string" && sessionObject.accessToken) {
    return sessionObject.accessToken;
  }

  const user = sessionObject.user;
  if (!user || typeof user !== "object") return undefined;

  const userObject = user as Record<string, unknown>;
  if (typeof userObject.accessToken === "string" && userObject.accessToken) {
    return userObject.accessToken;
  }

  return undefined;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[18px] sm:text-[20px] font-bold leading-none text-[#2D3D4D]">
      {children}
    </h3>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[13px] sm:text-[14px] font-medium text-[#2D3D4D]">
      {children}
    </label>
  );
}

function UploadBox({
  id,
  multiple = false,
  onChange,
  label = "Upload image",
}: {
  id: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}) {
  return (
    <>
      <label
        htmlFor={id}
        className="flex h-[86px] sm:h-[92px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#F4F7F9] text-[#7B8794] transition hover:bg-[#eef2f5]"
      >
        <div className="flex flex-col items-center text-[12px] sm:text-[13px]">
          <Upload className="mb-2 h-4 w-4" />
          {label}
        </div>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
    </>
  );
}

function PreviewThumb({
  src,
  onRemove,
}: {
  src: string;
  onRemove?: () => void;
}) {
  return (
    <div className="relative h-[44px] w-[44px] overflow-hidden rounded-[4px] bg-[#D9D9D9] sm:h-[52px] sm:w-[52px]">
      <Image src={src} alt="" fill sizes="52px" className="object-cover" />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#2D3D4D] shadow"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export function EditBoilerModal({
  open,
  onOpenChange,
  product,
}: EditBoilerModalProps) {
  const [badges, setBadges] = useState<string[]>(DEFAULT_BADGES);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showAddBadgeInput, setShowAddBadgeInput] = useState(false);
  const [newBadge, setNewBadge] = useState("");
  const [isEditingBadges, setIsEditingBadges] = useState(false);
  const [isEditingFeatures, setIsEditingFeatures] = useState(false);
  const [isEditingIncluded, setIsEditingIncluded] = useState(false);
  const [isEditingAlsoUse, setIsEditingAlsoUse] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [payablePrice, setPayablePrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [boilerAbility, setBoilerAbility] = useState("");
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");

  const [features, setFeatures] = useState([{ title: "", details: "" }]);
  const [included, setIncluded] = useState([""]);
  const [alsoUse, setAlsoUse] = useState([""]);
  const [steps, setSteps] = useState([""]);

  const [files, setFiles] = useState<File[]>([]);
  const [productLogo, setProductLogo] = useState<File | null>(null);
  const [anotherLogo, setAnotherLogo] = useState<File | null>(null);
  const [featureImage, setFeatureImage] = useState<File | null>(null);
  const [includeImages, setIncludeImages] = useState<File[]>([]);
  const [stepGuideImages, setStepGuideImages] = useState<File[]>([]);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingIncludedImages, setExistingIncludedImages] = useState<string[]>([]);
  const [existingFeatureLogos, setExistingFeatureLogos] = useState<string[]>([]);
  const [existingInstallationImages, setExistingInstallationImages] = useState<string[]>([]);
  const [boilerImagesChanged, setBoilerImagesChanged] = useState(false);

  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = resolveAccessToken(session);

  const handleAddBadge = () => {
    const trimmed = newBadge.trim();
    if (!trimmed) return;

    setBadges((prev) => [...prev, trimmed]);
    setSelectedBadges((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setNewBadge("");
    setShowAddBadgeInput(false);
  };

  const handleRemoveBadge = (badge: string) => {
    setBadges((prev) => prev.filter((item) => item !== badge));
    setSelectedBadges((prev) => prev.filter((item) => item !== badge));
  };

  const handleToggleBadge = (badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((item) => item !== badge)
        : [...prev, badge]
    );
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [{ title: "", details: "" }];
    });
  };

  const handleRemoveIncluded = (index: number) => {
    setIncluded((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleRemoveAlsoUse = (index: number) => {
    setAlsoUse((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleReset = () => {
    setBadges(DEFAULT_BADGES);
    setSelectedBadges([]);
    setShowAddBadgeInput(false);
    setNewBadge("");
    setIsEditingBadges(false);
    setIsEditingFeatures(false);
    setIsEditingIncluded(false);
    setIsEditingAlsoUse(false);
    setIsEditingSteps(false);

    setTitle("");
    setShortDescription("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setPayablePrice("");
    setMonthlyPrice("");
    setBoilerAbility("");
    setFeatureTitle("");
    setFeatureDescription("");

    setFeatures([{ title: "", details: "" }]);
    setIncluded([""]);
    setAlsoUse([""]);
    setSteps([""]);

    setFiles([]);
    setProductLogo(null);
    setAnotherLogo(null);
    setFeatureImage(null);
    setIncludeImages([]);
    setStepGuideImages([]);

    setExistingImages([]);
    setExistingIncludedImages([]);
    setExistingFeatureLogos([]);
    setExistingInstallationImages([]);
    setBoilerImagesChanged(false);
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !product) return;

    setTitle(product.title ?? "");
    setDescription(product.description ?? "");
    setShortDescription(product.shortDescription ?? "");
    setPrice(product.price !== undefined ? String(product.price) : "");
    setDiscountPrice(product.discountPrice !== undefined ? String(product.discountPrice) : "");
    setPayablePrice(product.payablePrice !== undefined ? String(product.payablePrice) : "");
    setMonthlyPrice(product.monthlyPrice !== undefined ? String(product.monthlyPrice) : "");
    setBoilerAbility(product.boilerAbility ?? "");

    const incomingBadges =
      product.badges && product.badges.length > 0 ? product.badges : [];
    setBadges(incomingBadges.length > 0 ? incomingBadges : DEFAULT_BADGES);
    setSelectedBadges(incomingBadges);

    const featuresFromApi = Array.isArray(product.boilerFeatures)
      ? product.boilerFeatures
          .map((feature) => {
            if (typeof feature === "string") {
              return { title: feature, details: "" };
            }
            return {
              title: feature.title ?? feature.warranty ?? "",
              details: feature.value ?? feature.details ?? "",
            };
          })
          .filter((feature) => feature.title || feature.details)
      : [];
    setFeatures(featuresFromApi.length > 0 ? featuresFromApi : [{ title: "", details: "" }]);

    if (product.boilerIncludedData) {
      const list = product.boilerIncludedData
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      setIncluded(list.length > 0 ? list : [""]);
    } else {
      setIncluded([""]);
    }

    if (product.alsoUseData) {
      const list = product.alsoUseData
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      setAlsoUse(list.length > 0 ? list : [""]);
    } else {
      setAlsoUse([""]);
    }

    const stepsFromApi =
      product.boilerInstallationGuide?.map((step) => step.title ?? "").filter(Boolean) ?? [];
    setSteps(stepsFromApi.length > 0 ? stepsFromApi : [""]);

    setFeatureTitle(product.featureInformation?.featureTitle ?? "");
    setFeatureDescription(product.featureInformation?.featureDescription ?? "");

    setExistingImages((product.images ?? []).filter((src) => isValidImageSrc(src)));
    setExistingIncludedImages(
      (product.includedImages ?? []).filter((src) => isValidImageSrc(src))
    );
    setExistingFeatureLogos(
      (product.featureInformation?.featureLogo ?? []).filter((src) =>
        isValidImageSrc(src)
      )
    );
    const installationImages =
      product.boilerInstallationGuide
        ?.map((item) => item.image ?? "")
        .filter((src) => isValidImageSrc(src)) ?? [];
    setExistingInstallationImages(installationImages);

    setFiles([]);
    setProductLogo(null);
    setAnotherLogo(null);
    setFeatureImage(null);
    setIncludeImages([]);
    setStepGuideImages([]);
    setBoilerImagesChanged(false);
  }, [open, product]);

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      if (!product?._id) {
        throw new Error("Missing product id.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const priceValue = Number(price) || 0;
      const discountValue = Number(discountPrice) || 0;
      const payableValue =
        Number(payablePrice) || (discountValue > 0 ? discountValue : priceValue);
      const monthlyValue = Number(monthlyPrice) || 0;

      const boilerFeatures = features
        .map((feature) => ({
          title: feature.title.trim(),
          value: feature.details.trim(),
        }))
        .filter((feature) => feature.title || feature.value);

      const boilerInstallationGuide = steps
        .map((step) => step.trim())
        .filter(Boolean)
        .map((step, index) => ({
          title: step,
          image: existingInstallationImages[index] || undefined,
        }));

      const payload = {
        title: title.trim(),
        description,
        shortDescription: shortDescription.trim() || description,
        badges: selectedBadges,
        price: priceValue,
        discountPrice: discountValue,
        payablePrice: payableValue,
        monthlyPrice: monthlyValue,
        boilerAbility: boilerAbility.trim(),
        boilerFeatures,
        featureInformation: {
          featureTitle: featureTitle.trim(),
          featureDescription: featureDescription.trim(),
          featureLogo: existingFeatureLogos.filter(Boolean),
        },
        boilerIncludedData: included.map((item) => item.trim()).filter(Boolean).join("\n"),
        alsoUseData: alsoUse.map((item) => item.trim()).filter(Boolean).join("\n"),
        boilerInstallationGuide,
        images: existingImages.filter(Boolean),
        includedImages: existingIncludedImages.filter(Boolean),
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      const getFileNameFromUrl = (url: string, fallback: string) => {
        const cleanUrl = url.split("?")[0];
        const name = cleanUrl.split("/").pop();
        return name && name.trim() ? name : fallback;
      };

      const convertImageUrlToFile = async (url: string, fallbackName: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to keep existing image: ${url}`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || "image/jpeg";
        const fileName = getFileNameFromUrl(url, fallbackName);
        return new File([blob], fileName, { type: mimeType });
      };

      if (boilerImagesChanged) {
        const mergedImageFiles: File[] = [...files];
        const keptExistingImages = existingImages.filter(Boolean);

        if (keptExistingImages.length > 0) {
          const keptExistingImageFiles = await Promise.all(
            keptExistingImages.map((url, index) =>
              convertImageUrlToFile(url, `existing-image-${index + 1}.jpg`)
            )
          );
          mergedImageFiles.push(...keptExistingImageFiles);
        }

        mergedImageFiles.forEach((file) => formData.append("images", file));
      } else {
        files.forEach((file) => formData.append("images", file));
      }
      includeImages.forEach((file) => formData.append("includedImages", file));
      stepGuideImages.forEach((file) =>
        formData.append("installationGuideImages", file)
      );

      const featureLogos = [productLogo, anotherLogo, featureImage].filter(
        (file): file is File => Boolean(file)
      );
      featureLogos.forEach((file) => formData.append("featureLogo", file));

      const response = await fetch(`${apiBase}/products/${product._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to update product.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Product updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["products", token] });
      onOpenChange(false);
      handleReset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product."
      );
    },
  });

  const handleSubmit = () => {
    if (!product?._id) {
      toast.error("Product details not available.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    updateProductMutation.mutate();
  };

  const handleClose = () => {
    if (!updateProductMutation.isPending) {
      onOpenChange(false);
    }
  };

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );
  const productLogoUrl = useMemo(
    () => (productLogo ? URL.createObjectURL(productLogo) : ""),
    [productLogo]
  );
  const anotherLogoUrl = useMemo(
    () => (anotherLogo ? URL.createObjectURL(anotherLogo) : ""),
    [anotherLogo]
  );
  const featureImageUrl = useMemo(
    () => (featureImage ? URL.createObjectURL(featureImage) : ""),
    [featureImage]
  );
  const includeImageUrls = useMemo(
    () => includeImages.map((file) => URL.createObjectURL(file)),
    [includeImages]
  );
  const stepGuideImageUrls = useMemo(
    () => stepGuideImages.map((file) => URL.createObjectURL(file)),
    [stepGuideImages]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      if (productLogoUrl) URL.revokeObjectURL(productLogoUrl);
      if (anotherLogoUrl) URL.revokeObjectURL(anotherLogoUrl);
      if (featureImageUrl) URL.revokeObjectURL(featureImageUrl);
    };
  }, [productLogoUrl, anotherLogoUrl, featureImageUrl]);

  useEffect(() => {
    return () => {
      includeImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [includeImageUrls]);

  useEffect(() => {
    return () => {
      stepGuideImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stepGuideImageUrls]);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (nextFiles.length === 0) return;
    setFiles((prev) => [...prev, ...nextFiles]);
    setBoilerImagesChanged(true);
    event.target.value = "";
  };

  const handleReplaceProductLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProductLogo(file);
    setExistingFeatureLogos((prev) => {
      const next = [...prev];
      next[0] = "";
      return next;
    });
    event.target.value = "";
  };

  const handleReplaceAnotherLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnotherLogo(file);
    setExistingFeatureLogos((prev) => {
      const next = [...prev];
      next[1] = "";
      return next;
    });
    event.target.value = "";
  };

  const handleReplaceFeatureImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFeatureImage(file);
    setExistingFeatureLogos((prev) => {
      const next = [...prev];
      next[2] = "";
      return next;
    });
    event.target.value = "";
  };

  const handleMultiFileChange =
    (setter: (value: File[] | ((prev: File[]) => File[])) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = Array.from(event.target.files ?? []);
      if (nextFiles.length === 0) return;
      setter((prev) => [...prev, ...nextFiles]);
      event.target.value = "";
    };

  const handleRemoveIncludeImage = (index: number) => {
    setIncludeImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveStepGuideImage = (index: number) => {
    setStepGuideImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
    setBoilerImagesChanged(true);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
    setBoilerImagesChanged(true);
  };

  const handleRemoveExistingIncludeImage = (index: number) => {
    setExistingIncludedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveExistingStepImage = (index: number) => {
    setExistingInstallationImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveExistingFeatureLogo = (index: number) => {
    setExistingFeatureLogos((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="!w-[1320px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[12px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          <div className="border-b border-[#EEF2F5] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[26px] sm:text-[30px] font-bold text-[#2D3D4D]">
                Edit Boiler
              </DialogTitle>
            </div>
          </div>

          <div className="max-h-[calc(95vh-96px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-6">
              <div>
                <FieldLabel>Boiler Title</FieldLabel>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Type your title..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] shadow-none placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <FieldLabel>Boiler Ability</FieldLabel>
                <Input
                  value={boilerAbility}
                  onChange={(event) => setBoilerAbility(event.target.value)}
                  placeholder="Type boiler ability..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] shadow-none placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <FieldLabel>Boiler Description</FieldLabel>
                <div className="quill-editor boiler-quill-editor overflow-hidden rounded-[10px] border border-[#D9E0E7] bg-white shadow-sm">
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
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>Add Badges</SectionTitle>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddBadgeInput((prev) => !prev)}
                      className="h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                    >
                      Add more badge
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsEditingBadges((prev) => !prev)}
                      className="h-[36px] rounded-[8px] bg-[#FBFF26] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                    >
                      <SquarePen className="mr-2 h-4 w-4" />
                      {isEditingBadges ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                {showAddBadgeInput && (
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={newBadge}
                      onChange={(event) => setNewBadge(event.target.value)}
                      placeholder="Type badge name..."
                      className="h-[40px] max-w-[280px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                    />
                    <Button
                      type="button"
                      onClick={handleAddBadge}
                      className="h-[40px] rounded-[8px] bg-[#00A56F] px-4 text-[14px] text-white hover:bg-[#009562]"
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {badges.map((badge, index) => (
                    <div
                      key={`${badge}-${index}`}
                      className="flex items-center gap-2 rounded-full bg-[#F4F7F9] px-3 py-2 text-[14px] font-medium text-[#2D3D4D]"
                    >
                      {isEditingBadges ? (
                        <>
                          <Input
                            value={badge}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setBadges((prev) => {
                                const next = [...prev];
                                next[index] = nextValue;
                                return next;
                              });
                              setSelectedBadges((prev) =>
                                prev.map((item) => (item === badge ? nextValue : item))
                              );
                            }}
                            className="h-[28px] w-[160px] border-0 bg-transparent p-0 text-[14px] shadow-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBadge(badge)}
                            className="text-[#94A3B8] hover:text-[#2D3D4D]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={selectedBadges.includes(badge)}
                            onChange={() => handleToggleBadge(badge)}
                            className="h-4 w-4 rounded border-[#CBD5E1]"
                          />
                          <span>{badge}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Boiler Price</FieldLabel>
                <Input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Type boiler price..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                />
              </div>

              <div>
                <FieldLabel>Enter Discount in this boiler</FieldLabel>
                <Input
                  value={discountPrice}
                  onChange={(event) => setDiscountPrice(event.target.value)}
                  placeholder="Type your discount price..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                />
              </div>

              <div>
                <FieldLabel>Upload boiler images</FieldLabel>

                <div className="mb-3 flex flex-wrap gap-3">
                  {existingImages.map((url, index) => (
                    <PreviewThumb
                      key={`existing-${url}-${index}`}
                      src={url}
                      onRemove={() => handleRemoveExistingImage(index)}
                    />
                  ))}
                  {previewUrls.map((url, index) => (
                    <PreviewThumb
                      key={url}
                      src={url}
                      onRemove={() => handleRemoveImage(index)}
                    />
                  ))}
                </div>

                <UploadBox
                  id="boiler-image-upload"
                  multiple
                  onChange={handleFilesChange}
                />
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>Enter Features for this boiler</SectionTitle>

                  <Button
                    type="button"
                    onClick={() => setIsEditingFeatures((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#FBFF26] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingFeatures ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <FieldLabel>Feature title</FieldLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Type your feature title..."
                            value={feature.title}
                            onChange={(e) => {
                              const next = [...features];
                              next[index].title = e.target.value;
                              setFeatures(next);
                            }}
                            className="h-[42px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                          />
                          {isEditingFeatures && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-[#94A3B8] hover:text-[#2D3D4D]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Feature Details</FieldLabel>
                        <Input
                          placeholder="Type your feature title..."
                          value={feature.details}
                          onChange={(e) => {
                            const next = [...features];
                            next[index].details = e.target.value;
                            setFeatures(next);
                          }}
                          className="h-[42px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFeatures((prev) => [...prev, { title: "", details: "" }])
                  }
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add more Features
                </Button>
              </div>

              <div>
                <SectionTitle>Feature Section information</SectionTitle>

                <div className="mt-4 space-y-4">
                  <div>
                    <FieldLabel>Feature Title</FieldLabel>
                    <Input
                      value={featureTitle}
                      onChange={(event) => setFeatureTitle(event.target.value)}
                      placeholder="Type your title..."
                      className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Feature Description</FieldLabel>
                    <div className="quill-editor boiler-quill-editor overflow-hidden rounded-[10px] border border-[#D9E0E7] bg-white shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={featureDescription}
                        onChange={setFeatureDescription}
                        placeholder="Type Feature description..."
                        modules={quillModules}
                        formats={quillFormats}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Upload Product logo</FieldLabel>
                  <div className="mb-3">
                    {productLogoUrl ? (
                      <PreviewThumb
                        src={productLogoUrl}
                        onRemove={() => setProductLogo(null)}
                      />
                    ) : existingFeatureLogos[0] ? (
                      <PreviewThumb
                        src={existingFeatureLogos[0]}
                        onRemove={() => handleRemoveExistingFeatureLogo(0)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="product-logo-upload"
                    onChange={handleReplaceProductLogo}
                  />
                </div>

                <div>
                  <FieldLabel>Upload Another logo</FieldLabel>
                  <div className="mb-3">
                    {anotherLogoUrl ? (
                      <PreviewThumb
                        src={anotherLogoUrl}
                        onRemove={() => setAnotherLogo(null)}
                      />
                    ) : existingFeatureLogos[1] ? (
                      <PreviewThumb
                        src={existingFeatureLogos[1]}
                        onRemove={() => handleRemoveExistingFeatureLogo(1)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="another-logo-upload"
                    onChange={handleReplaceAnotherLogo}
                  />
                </div>

                <div>
                  <FieldLabel>Upload Boiler Feature image</FieldLabel>
                  <div className="mb-3">
                    {featureImageUrl ? (
                      <PreviewThumb
                        src={featureImageUrl}
                        onRemove={() => setFeatureImage(null)}
                      />
                    ) : existingFeatureLogos[2] ? (
                      <PreviewThumb
                        src={existingFeatureLogos[2]}
                        onRemove={() => handleRemoveExistingFeatureLogo(2)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="boiler-feature-upload"
                    onChange={handleReplaceFeatureImage}
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>What’s included</SectionTitle>

                  <Button
                    type="button"
                    onClick={() => setIsEditingIncluded((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#FBFF26] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingIncluded ? "Done" : "Edit"}
                  </Button>
                </div>

                <FieldLabel>Include</FieldLabel>
                <div className="space-y-3">
                  {included.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type what’s include..."
                        value={item}
                        onChange={(e) => {
                          const next = [...included];
                          next[index] = e.target.value;
                          setIncluded(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingIncluded && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIncluded(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIncluded((prev) => [...prev, ""])}
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add included
                </Button>
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <FieldLabel>Also on us.....</FieldLabel>

                  <Button
                    type="button"
                    onClick={() => setIsEditingAlsoUse((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#FBFF26] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingAlsoUse ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {alsoUse.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type what’s Also on us........"
                        value={item}
                        onChange={(e) => {
                          const next = [...alsoUse];
                          next[index] = e.target.value;
                          setAlsoUse(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingAlsoUse && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAlsoUse(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAlsoUse((prev) => [...prev, ""])}
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Also on us....
                </Button>
              </div>

              <div>
                <FieldLabel>Upload Include image</FieldLabel>

                <div className="mb-3 flex flex-wrap gap-3">
                  {existingIncludedImages.map((url, index) => (
                    <PreviewThumb
                      key={`existing-include-${url}-${index}`}
                      src={url}
                      onRemove={() => handleRemoveExistingIncludeImage(index)}
                    />
                  ))}
                  {includeImageUrls.map((url, index) => (
                    <PreviewThumb
                      key={`${url}-${index}`}
                      src={url}
                      onRemove={() => handleRemoveIncludeImage(index)}
                    />
                  ))}
                </div>

                <UploadBox
                  id="include-image-upload"
                  multiple
                  onChange={handleMultiFileChange(setIncludeImages)}
                />
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>A Step by step guide to your installation</SectionTitle>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSteps((prev) => [...prev, ""])}
                      className="h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsEditingSteps((prev) => !prev)}
                      className="h-[36px] rounded-[8px] bg-[#FBFF26] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
                    >
                      <SquarePen className="mr-2 h-4 w-4" />
                      {isEditingSteps ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                <FieldLabel>Guide Text</FieldLabel>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type your guide text..."
                        value={step}
                        onChange={(e) => {
                          const next = [...steps];
                          next[index] = e.target.value;
                          setSteps(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingSteps && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <FieldLabel>Upload Guide image</FieldLabel>

                  <div className="mb-3 flex flex-wrap gap-3">
                    {existingInstallationImages.map((url, index) => (
                      <PreviewThumb
                        key={`existing-step-${url}-${index}`}
                        src={url}
                        onRemove={() => handleRemoveExistingStepImage(index)}
                      />
                    ))}
                    {stepGuideImageUrls.map((url, index) => (
                      <PreviewThumb
                        key={`${url}-${index}`}
                        src={url}
                        onRemove={() => handleRemoveStepGuideImage(index)}
                      />
                    ))}
                  </div>

                  <UploadBox
                    id="step-guide-upload"
                    multiple
                    onChange={handleMultiFileChange(setStepGuideImages)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateProductMutation.isPending}
                  className="h-[48px] rounded-[10px] border border-[#F5D64E] bg-transparent text-[15px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={updateProductMutation.isPending}
                  className="h-[48px] rounded-[10px] bg-[#FBFF26] text-[15px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updateProductMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
