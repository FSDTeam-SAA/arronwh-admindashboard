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
import { X, Upload, Plus, Pencil } from "lucide-react";
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

interface EditBoilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductEditData | null;
}

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
  includedImages?: string[];
  boilerInstallationGuide?: Array<{ title?: string; image?: string }>;
};

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
  const [steps, setSteps] = useState([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [productLogo, setProductLogo] = useState<File | null>(null);
  const [anotherLogo, setAnotherLogo] = useState<File | null>(null);
  const [featureImage, setFeatureImage] = useState<File | null>(null);
  const [troubleImages, setTroubleImages] = useState<File[]>([]);
  const [stepGuideImages, setStepGuideImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingIncludedImages, setExistingIncludedImages] = useState<string[]>(
    []
  );
  const [existingFeatureLogos, setExistingFeatureLogos] = useState<string[]>(
    []
  );
  const [existingInstallationImages, setExistingInstallationImages] = useState<
    string[]
  >([]);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

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
    setSteps([""]);
    setFiles([]);
    setProductLogo(null);
    setAnotherLogo(null);
    setFeatureImage(null);
    setTroubleImages([]);
    setStepGuideImages([]);
    setExistingImages([]);
    setExistingIncludedImages([]);
    setExistingFeatureLogos([]);
    setExistingInstallationImages([]);
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
    setDiscountPrice(
      product.discountPrice !== undefined ? String(product.discountPrice) : ""
    );
    setPayablePrice(
      product.payablePrice !== undefined ? String(product.payablePrice) : ""
    );
    setMonthlyPrice(
      product.monthlyPrice !== undefined ? String(product.monthlyPrice) : ""
    );
    setBoilerAbility(product.boilerAbility ?? "");

    const incomingBadges =
      product.badges && product.badges.length > 0 ? product.badges : [];
    setBadges(
      incomingBadges.length > 0 ? incomingBadges : DEFAULT_BADGES
    );
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
    setFeatures(
      featuresFromApi.length > 0 ? featuresFromApi : [{ title: "", details: "" }]
    );

    if (product.boilerIncludedData) {
      const list = product.boilerIncludedData
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      setIncluded(list.length > 0 ? list : [""]);
    } else {
      setIncluded([""]);
    }

    const stepsFromApi =
      product.boilerInstallationGuide?.map((step) => step.title ?? "").filter(Boolean) ??
      [];
    setSteps(stepsFromApi.length > 0 ? stepsFromApi : [""]);

    setFeatureTitle(product.featureInformation?.featureTitle ?? "");
    setFeatureDescription(product.featureInformation?.featureDescription ?? "");

    setExistingImages(
      (product.images ?? []).filter((src) => isValidImageSrc(src))
    );
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
    setTroubleImages([]);
    setStepGuideImages([]);
  }, [open, product]);

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const priceValue = Number(price) || 0;
      const discountValue = Number(discountPrice) || 0;
      const payableValue =
        Number(payablePrice) ||
        (discountValue > 0 ? discountValue : priceValue);
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
        .map((step) => ({ title: step }));

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
        },
        boilerIncludedData: included
          .map((item) => item.trim())
          .filter(Boolean)
          .join("\n"),
        boilerInstallationGuide,
      };

      if (!product?._id) {
        throw new Error("Missing product id.");
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      files.forEach((file) => formData.append("images", file));
      troubleImages.forEach((file) => formData.append("includedImages", file));
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
      const hasExplicitFailure =
        data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to create product.");
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
  const troubleImageUrls = useMemo(
    () => troubleImages.map((file) => URL.createObjectURL(file)),
    [troubleImages]
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
      troubleImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [troubleImageUrls]);

  useEffect(() => {
    return () => {
      stepGuideImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stepGuideImageUrls]);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (nextFiles.length === 0) return;
    setFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleSingleFileChange =
    (setter: (file: File | null) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setter(file);
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

  const handleRemoveTroubleImage = (index: number) => {
    setTroubleImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveStepGuideImage = (index: number) => {
    setStepGuideImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="!w-[1320px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[12px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          <div className="border-b border-[#EEF2F5] px-6 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[16px] font-bold text-[#2D3D4D]">
                Edit Boiler
              </DialogTitle>

          
            </div>
          </div>

          <div className="max-h-[calc(94vh-82px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Boiler Title
                </label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Type your title..."
                  className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Boiler Description
                </label>
                <div className="quill-editor overflow-hidden rounded-[8px] border border-[#D9E0E7] bg-white shadow-sm">
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
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Short Description
                </label>
                <Input
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  placeholder="Type short description..."
                  className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[16px] font-medium text-[#2D3D4D]">
                    Add Badges
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setShowAddBadgeInput((prev) => !prev)
                    }
                    className="h-[30px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
                  >
                    {showAddBadgeInput ? "Cancel" : "Add new badge"}
                  </Button>
                </div>

                {showAddBadgeInput && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={newBadge}
                      onChange={(event) => setNewBadge(event.target.value)}
                      placeholder="Type badge name..."
                      className="h-[34px] max-w-[260px] rounded-[8px] border-0 bg-[#F4F7F9] px-3 text-[16px] text-[#2D3D4D] placeholder:text-[#9CA3AF]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddBadge}
                      className="h-[34px] rounded-[8px] bg-[#00A56F] px-4 text-[16px] font-semibold text-white hover:bg-[#009562]"
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  {badges.map((badge, index) => (
                    <div
                      key={`${badge}-${index}`}
                      className="flex items-center gap-2 text-[16px] text-[#2D3D4D]"
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
                                prev.map((item) =>
                                  item === badge ? nextValue : item
                                )
                              );
                            }}
                            className="h-[32px] w-[200px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
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
                            className="h-3.5 w-3.5"
                          />
                          <span>{badge}</span>
                        </>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={() => setIsEditingBadges((prev) => !prev)}
                    className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {isEditingBadges ? "Done" : "Edit"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Boiler Price
                  </label>
                  <Input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Type boiler price..."
                    className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Boiler Discount Price Info
                  </label>
                  <Input
                    value={discountPrice}
                    onChange={(event) => setDiscountPrice(event.target.value)}
                    placeholder="Type your discount price..."
                    className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Payable Price
                  </label>
                  <Input
                    value={payablePrice}
                    onChange={(event) => setPayablePrice(event.target.value)}
                    placeholder="Type payable price..."
                    className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Monthly Price
                  </label>
                  <Input
                    value={monthlyPrice}
                    onChange={(event) => setMonthlyPrice(event.target.value)}
                    placeholder="Type monthly price..."
                    className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Boiler Ability
                </label>
                <Input
                  value={boilerAbility}
                  onChange={(event) => setBoilerAbility(event.target.value)}
                  placeholder="Type boiler ability..."
                  className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Upload boiler image
                </label>
                <div className="flex flex-wrap items-center gap-3">
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
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <label
                  htmlFor="boiler-image-upload"
                  className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                >
                  <div className="flex flex-col items-center text-[16px]">
                    <Upload className="mb-1 h-4 w-4" />
                    Upload image
                  </div>
                </label>
                <input
                  id="boiler-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesChange}
                  className="hidden"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[16px] font-medium text-[#2D3D4D]">
                    Enter Features for this boiler
                  </label>

                  <Button
                    type="button"
                    onClick={() => setIsEditingFeatures((prev) => !prev)}
                    className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {isEditingFeatures ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                      <Input
                        placeholder="Type your feature title..."
                        value={feature.title}
                        onChange={(e) => {
                          const next = [...features];
                          next[index].title = e.target.value;
                          setFeatures(next);
                        }}
                        className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none sm:flex-1"
                      />
                      <Input
                        placeholder="Type your feature title..."
                        value={feature.details}
                        onChange={(e) => {
                          const next = [...features];
                          next[index].details = e.target.value;
                          setFeatures(next);
                        }}
                        className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none sm:flex-1"
                      />
                      {isEditingFeatures && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="self-start text-[#94A3B8] hover:text-[#2D3D4D] sm:self-auto"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Feature Section Information
                </label>

                <Input
                  value={featureTitle}
                  onChange={(event) => setFeatureTitle(event.target.value)}
                  placeholder="Type your title..."
                  className="mb-3 h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none"
                />

                <textarea
                  value={featureDescription}
                  onChange={(event) => setFeatureDescription(event.target.value)}
                  placeholder="Type feature description..."
                  className="min-h-[80px] w-full rounded-[6px] border border-[#D9E0E7] bg-[#F4F7F9] px-3 py-3 text-[16px] text-[#2D3D4D] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Upload Product logo
                  </label>
                  <div className="flex items-center gap-3">
                    {existingFeatureLogos.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {existingFeatureLogos.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                          >
                            <Image
                              src={url}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {productLogoUrl ? (
                      <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
                        <Image
                          src={productLogoUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setProductLogo(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    <label
                      htmlFor="product-logo-upload"
                      className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                    >
                      <div className="flex flex-col items-center text-[16px]">
                        <Upload className="mb-1 h-4 w-4" />
                        Upload image
                      </div>
                    </label>
                    <input
                      id="product-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleSingleFileChange(setProductLogo)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Upload Another logo
                  </label>
                  <div className="flex items-center gap-3">
                    {anotherLogoUrl ? (
                      <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
                        <Image
                          src={anotherLogoUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setAnotherLogo(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    <label
                      htmlFor="another-logo-upload"
                      className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                    >
                      <div className="flex flex-col items-center text-[16px]">
                        <Upload className="mb-1 h-4 w-4" />
                        Upload image
                      </div>
                    </label>
                    <input
                      id="another-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleSingleFileChange(setAnotherLogo)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                    Upload Boiler Feature image
                  </label>
                  <div className="flex items-center gap-3">
                    {featureImageUrl ? (
                      <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
                        <Image
                          src={featureImageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFeatureImage(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    <label
                      htmlFor="boiler-feature-upload"
                      className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                    >
                      <div className="flex flex-col items-center text-[16px]">
                        <Upload className="mb-1 h-4 w-4" />
                        Upload image
                      </div>
                    </label>
                    <input
                      id="boiler-feature-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleSingleFileChange(setFeatureImage)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[16px] font-medium text-[#2D3D4D]">
                    What&apos;s included
                  </label>

                  <Button
                    type="button"
                    onClick={() => setIsEditingIncluded((prev) => !prev)}
                    className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {isEditingIncluded ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {included.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type what's include..."
                        value={item}
                        onChange={(e) => {
                          const next = [...included];
                          next[index] = e.target.value;
                          setIncluded(next);
                        }}
                        className="h-[40px] flex-1 border-0 bg-[#F4F7F9] text-[16px] shadow-none"
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

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIncluded((prev) => [...prev, ""])}
                    className="h-[28px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Include
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
                  Upload trouble image
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {existingIncludedImages.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {troubleImageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTroubleImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <label
                  htmlFor="trouble-image-upload"
                  className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                >
                  <div className="flex flex-col items-center text-[16px]">
                    <Upload className="mb-1 h-4 w-4" />
                    Upload image
                  </div>
                </label>
                <input
                  id="trouble-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultiFileChange(setTroubleImages)}
                  className="hidden"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[16px] font-medium text-[#2D3D4D]">
                    A Step by step guide to your installation
                  </label>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSteps((prev) => [...prev, ""])}
                      className="h-[28px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsEditingSteps((prev) => !prev)}
                      className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {isEditingSteps ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type your guide title..."
                        value={step}
                        onChange={(e) => {
                          const next = [...steps];
                          next[index] = e.target.value;
                          setSteps(next);
                        }}
                        className="h-[40px] flex-1 border-0 bg-[#F4F7F9] text-[16px] shadow-none"
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

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {existingInstallationImages.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {stepGuideImageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStepGuideImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <label
                  htmlFor="step-guide-upload"
                  className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
                >
                  <div className="flex flex-col items-center text-[16px]">
                    <Upload className="mb-1 h-4 w-4" />
                    Upload image
                  </div>
                </label>
                <input
                  id="step-guide-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultiFileChange(setStepGuideImages)}
                  className="hidden"
                />

              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateProductMutation.isPending}
                  className="h-[46px] border border-[#F5D64E] bg-transparent text-[16px] text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={updateProductMutation.isPending}
                  className="h-[46px] bg-[#F5D64E] text-[16px] text-[#2D3D4D] hover:bg-[#edcf47] disabled:cursor-not-allowed disabled:opacity-70"
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
