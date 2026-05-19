"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Pencil,
  Trash2,
  X,
  CircleDollarSign,
  BadgePercent,
  ShieldCheck,
  Flame,
  Ruler,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddNewBoilerModal } from "./_components/AddNewBoilerModal";
import { EditBoilerModal } from "./_components/EditBoilerModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ProductItem = {
  id: string;
  systemName?: string;
  productLabel?: string;
  title: string;
  boilerAbility: string;
  topBadge?: string;
  badgeBubble?: string;
  tags: string[];
  images: string[];
  summaryTitle: string;
  summaryPoints: string[];
  specs: {
    label: string;
    value: string;
  }[];
  payToday: string;
  payTodayOld?: string;
  monthlyCost: string;
  monthlyCostOld?: string;
  discountTitle: string;
  discountValue: string;
  raw?: ProductApiItem;
};

type ApiBoilerFeature = {
  title?: string;
  value?: string;
  details?: string;
};

type ProductApiItem = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  badges?: string[];
  price?: number;
  discountPrice?: number;
  payablePrice?: number;
  monthlyPrice?: number;
  boilerAbility?: string;
  boilerIncludedData?: string;
  boilerFeatures?: Array<ApiBoilerFeature | string>;
};

type ProductsApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  data: ProductApiItem[];
};

function Tag({ label }: { label: string }) {
  const normalizedLabel = label
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const isFinance = normalizedLabel.toLowerCase().includes("finance");

  if (!normalizedLabel) return null;

  return (
    <div
      className={cn(
        "inline-flex h-[38px] items-center justify-center rounded-full px-3 text-[11px] sm:text-[16px] font-medium",
        isFinance ? "bg-[#6EC1F3] text-[#2D3D4D]" : "bg-[#FBFF26] text-[#2D3D4D]"
      )}
    >
      {normalizedLabel}
    </div>
  );
}

function SpecIcon({ label }: { label: string }) {
  const lowered = label.toLowerCase();
  if (lowered.includes("warranty")) return <ShieldCheck className="h-4 w-4 text-[#64748B]" />;
  if (lowered.includes("flow")) return <CircleDollarSign className="h-4 w-4 text-[#64748B]" />;
  if (lowered.includes("heating")) return <Flame className="h-4 w-4 text-[#64748B]" />;
  return <Ruler className="h-4 w-4 text-[#64748B]" />;
}

const FALLBACK_IMAGE = "/hitterpng.png";

const stripHtml = (value?: string) =>
  value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

const formatBoilerAbilityShort = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  const parts = cleaned.split(" ");
  if (parts.length <= 2) return cleaned;

  const kwPartIndex = parts.findIndex((part) => /kw$/i.test(part));
  if (kwPartIndex > 0 && /\d/.test(parts[kwPartIndex - 1])) {
    return `${parts[kwPartIndex - 1]} ${parts[kwPartIndex]}`;
  }

  return parts.slice(-2).join(" ");
};

const formatMoney = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? `$${value.toLocaleString("en-US")}`
    : "";

const normalizeImage = (image?: string) => {
  if (!image) return FALLBACK_IMAGE;
  if (
    image.startsWith("/") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }
  return FALLBACK_IMAGE;
};

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[6px] border border-[#00A56F] bg-white">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="h-7 w-2/3 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[38px] w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_34px_minmax(0,1fr)_340px]">
          <div className="flex flex-col items-center">
            <div className="flex h-[280px] w-full items-center justify-center rounded-[8px] bg-[#F4F7F9]">
              <div className="h-[200px] w-[160px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[10px] w-[10px] animate-pulse rounded-full bg-[#E5E7EB]" />
              ))}
            </div>
          </div>

          <div className="hidden xl:block" />

          <div className="space-y-4">
            <div className="rounded-[8px] border-[2px] border-[#94A3B8] p-5">
              <div className="h-6 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-4 w-full animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                ))}
              </div>
            </div>
            <div className="rounded-[8px] border-[2px] border-[#94A3B8] p-5">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="h-4 w-1/3 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                    <div className="h-4 w-1/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[4px] bg-[#F0F3F6] p-4 sm:p-5">
            <div className="h-5 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-[8px] bg-white p-4">
                  <div className="h-4 w-1/2 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                  <div className="mt-2 h-7 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
            <div className="mt-4 h-[48px] animate-pulse rounded-[8px] bg-white" />
            <div className="mt-4 h-[46px] animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="mt-3 h-[46px] animate-pulse rounded-[6px] bg-[#E5E7EB]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = item.images.length > 0 ? item.images : [FALLBACK_IMAGE];
  const shortBoilerAbility = formatBoilerAbilityShort(item.boilerAbility);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="overflow-hidden rounded-[6px] border border-[#00A56F] bg-white shadow-sm">
      {item.topBadge ? (
        <div className="bg-[#00A56F] py-2 text-center text-[11px] sm:text-[12px] font-semibold tracking-wide text-white">
          {item.topBadge}
        </div>
      ) : null}

      <div className="p-3 sm:p-4 lg:p-5">
        {/* Title + tags */}
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold leading-tight text-[#2D3D4D]">
            {item.boilerAbility}
          </h3>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_34px_minmax(0,1fr)_340px]">
          {/* Image */}
          <div className="flex flex-col items-center">
            <div className="relative flex min-h-[280px] w-full items-center justify-center rounded-[8px] bg-white">
              <div className="absolute left-1/2 top-1/2 h-[150px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-[#FFD9C7]" />

              {item.badgeBubble ? (
                <div className="absolute right-[18%] top-[24%] z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6A6A] p-2 text-center text-[9px] font-bold leading-tight text-white shadow-md">
                  {item.badgeBubble}
                </div>
              ) : null}

              <Image
                src={images[activeImage]}
                alt={item.title}
                width={1000}
                height={1000}
                className="relative z-10 h-[250px] w-auto object-contain sm:h-[320px]"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "h-[10px] w-[10px] rounded-full transition",
                    index === activeImage ? "bg-[#00A56F]" : "bg-[#DDE3E8]"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Arrow (desktop only) */}
          <div className="hidden xl:flex items-center justify-center">
            <button
              type="button"
              onClick={nextImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2F5] text-[#64748B] transition hover:bg-[#E5EAF0]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Middle: summary + specs */}
          <div className="space-y-4">
            <div className="rounded-[8px] border-[2px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <h4 className="text-[18px] sm:text-[20px] font-bold leading-snug text-[#2D3D4D]">
                {item.summaryTitle}
              </h4>
              <div className="mt-3 space-y-2">
                {item.summaryPoints.map((point) => (
                  <p key={point} className="text-[13px] sm:text-[16px] text-[#2D3D4D]">
                    {point}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border-[2px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <div className="space-y-3">
                {item.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start justify-between gap-4 text-[13px] sm:text-[16px]"
                  >
                    <span className="text-[#2D3D4D]">{spec.label}</span>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-medium text-[#2D3D4D]">{spec.value}</span>
                      <SpecIcon label={spec.label} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: pricing */}
          <div className="rounded-[4px] bg-[#F0F3F6] p-4 sm:p-5">
            <h4 className="mb-4 text-center text-[16px] sm:text-[18px] font-medium text-[#2D3D4D]">
              Your fixed price including installation:
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <p className="text-[12px] sm:text-[14px] text-[#2D3D4D]">Pay today</p>
                <p className="mt-2 text-[20px] sm:text-[22px] font-bold leading-none text-[#2D3D4D]">
                  {item.payToday}
                </p>
                {item.payTodayOld ? (
                  <p className="mt-2 text-[11px] sm:text-[12px] font-medium text-[#00A56F] line-through">
                    {item.payTodayOld}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <p className="text-[12px] sm:text-[14px] text-[#2D3D4D]">Monthly Cost</p>
                <p className="mt-2 text-[20px] sm:text-[22px] font-bold leading-none text-[#2D3D4D]">
                  {item.monthlyCost}
                </p>
                {item.monthlyCostOld ? (
                  <p className="mt-2 text-[11px] sm:text-[12px] font-medium text-[#00A56F] line-through">
                    {item.monthlyCostOld}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex min-h-[48px] items-center justify-center rounded-[8px] bg-white px-3 text-center">
              <BadgePercent className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#64748B]" />
              <span className="text-[14px] sm:text-[15px] font-semibold text-[#2D3D4D]">
                {shortBoilerAbility}
              </span>
              <span className="ml-2 text-[14px] sm:text-[15px] font-semibold text-[#00A56F]">
                {item.discountValue}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceManagementPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const authHeaders: HeadersInit | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;
  const pageTitle = "Boiler Systems";
  const addButtonText = "Add New Boiler";
  const [openAddBoiler, setOpenAddBoiler] = useState(false);
  const [openEditBoiler, setOpenEditBoiler] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductApiItem | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const queryClient = useQueryClient();

  const productsQuery = useQuery<ProductsApiResponse>({
    queryKey: ["products", token],
    queryFn: async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/products`, {
        headers: authHeaders,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure =
        data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to load products.");
      }

      return data;
    },
  });

  const products = useMemo<ProductItem[]>(() => {
    const items = productsQuery.data?.data ?? [];
    return items.map((item, index) => {
      const tags = (item.badges ?? []).map((tag) => tag.trim()).filter(Boolean);
      const images = (item.images ?? []).map(normalizeImage);
      const description = stripHtml(item.description);
      const summaryTitle =
        stripHtml(item.title) || item.title;

      const summaryPoints = [
        description,
        stripHtml(item.boilerAbility),
        stripHtml(item.boilerIncludedData),
      ].filter(
        (point, pointIndex, allPoints) =>
          point && point !== summaryTitle && allPoints.indexOf(point) === pointIndex
      );

      const specs = (item.boilerFeatures ?? [])
        .map((feature) => {
          if (typeof feature === "string") {
            const value = stripHtml(feature);
            return {
              label: value ? "Feature" : "",
              value,
            };
          }

          return {
            label: feature?.title?.trim() ?? "",
            value: stripHtml(feature?.value ?? feature?.details ?? ""),
          };
        })
        .filter((feature) => feature.label && feature.value);

      const payToday = formatMoney(item.payablePrice) || formatMoney(item.price) || "$0";
      const payTodayOld =
        typeof item.price === "number" &&
        typeof item.payablePrice === "number" &&
        item.price > item.payablePrice
          ? `was ${formatMoney(item.price)}`
          : undefined;

      const monthlyCostValue = formatMoney(item.monthlyPrice);
      const monthlyCost = monthlyCostValue ? `${monthlyCostValue}+` : "$0";

      const discountAmount =
        typeof item.discountPrice === "number" && item.discountPrice > 0
          ? item.discountPrice
          : typeof item.price === "number" &&
              typeof item.payablePrice === "number"
            ? Math.max(item.price - item.payablePrice, 0)
            : 0;

      const topBadge = tags.some((tag) => /popular|best/i.test(tag))
        ? "OUR BEST SELLER"
        : undefined;

      return {
        id: item._id,
        systemName: "System - 01",
        productLabel: `Product ${String(index + 1).padStart(3, "0")}`,
        title: item.title,
        boilerAbility: stripHtml(item.boilerAbility) || stripHtml(item.title) || item.title,
        topBadge,
        badgeBubble: undefined,
        tags,
        images: images.length ? images : [FALLBACK_IMAGE],
        summaryTitle,
        summaryPoints,
        specs,
        payToday,
        payTodayOld,
        monthlyCost,
        monthlyCostOld: "",
        discountTitle: `${item.title} Discount`,
        discountValue:
          discountAmount > 0
            ? `-$${discountAmount.toLocaleString("en-US")}`
            : "$0",
        raw: item,
      };
    });
  }, [productsQuery.data]);

  const handleEditOpen = (item: ProductItem) => {
    if (!item.raw) {
      toast.error("Product details not available.");
      return;
    }
    setEditTarget(item.raw);
    setOpenEditBoiler(true);
  };

  const handleEditClose = (nextOpen: boolean) => {
    setOpenEditBoiler(nextOpen);
    if (!nextOpen) {
      setEditTarget(null);
    }
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBase}/products/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure =
        data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to delete product.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["products", token] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product."
      );
    },
  });

  const handleDeleteOpen = (item: ProductItem) => {
    setDeleteTarget(item);
    setOpenDeleteModal(true);
  };

  const handleDeleteClose = (nextOpen: boolean) => {
    setOpenDeleteModal(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProductMutation.mutate(deleteTarget.id);
  };

  const deleteLabel = deleteTarget?.title ?? "this product";

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-5">
        <div className="w-full">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[22px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
                Service Management
              </h1>

              <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-[#2D3D4D] sm:text-[16px]">
                <Link href="/" className="transition hover:text-[#00A56F]">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span>Service Management</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 sm:items-end">
              {/* <div className="flex items-center gap-4">
                <span className="inline-flex h-[40px] min-w-[140px] items-center justify-center rounded-[8px] bg-[#FBFF26] px-5 text-[15px] font-medium text-[#2D3D4D]">
                  Boiler Systems
                </span>
              </div> */}

              <Button
                onClick={() => setOpenAddBoiler(true)}
                className="h-[48px] rounded-[8px] bg-[#FBFF26] px-6 text-[16px] font-medium text-[#2D3D4D] hover:bg-[#FBFF26]/95"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addButtonText}
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-[24px] font-bold text-[#2D3D4D] sm:text-[28px]">
              {pageTitle}
            </h2>
          </div>

          <div className="space-y-6">
            {productsQuery.isLoading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <ProductCardSkeleton key={`product-skeleton-${index}`} />
                ))
              : products.length > 0
                ? products.map((item) => (
                    <div key={item.id} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[16px] font-semibold text-[#2D3D4D]">
                          {item.productLabel ?? "Product"}
                        </p>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditOpen(item)}
                            className="inline-flex h-[36px] items-center rounded-full bg-[#00A56F1A] px-4 text-[16px] font-medium text-[#12A150]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteOpen(item)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444] shadow-[0_10px_18px_rgba(239,68,68,0.25)] ring-2 ring-[#FCA5A5] transition hover:scale-[1.04] hover:bg-[#FECACA]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <ProductCard item={item} />
                    </div>
                  ))
                : (
                    <div className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
                      <p className="text-[16px] text-[#64748B]">
                        No products found.
                      </p>
                    </div>
                  )}
          </div>
        </div>
      </div>

      <AddNewBoilerModal
        open={openAddBoiler}
        onOpenChange={setOpenAddBoiler}
      />

      <EditBoilerModal
        open={openEditBoiler}
        onOpenChange={handleEditClose}
        product={editTarget}
      />

      <Dialog open={openDeleteModal} onOpenChange={handleDeleteClose}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[420px] max-w-[92vw] sm:max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7F9] text-[#F5D64E]">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[18px] font-semibold text-[#2D3D4D]">
              Are you sure?
            </DialogTitle>
            <p className="mt-2 text-[13px] text-[#64748B]">
              You want to delete {deleteLabel} from this Dashboard.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteClose(false)}
                disabled={deleteProductMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteProductMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95"
              >
                {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
