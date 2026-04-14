"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ChevronRightIcon,
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
  tags: string[];
  images: string[];
  subtitle: string;
  bullets: string[];
  specs: {
    label: string;
    value: string;
    icon?: "warranty" | "flow" | "heat" | "size";
  }[];
  payToday: string;
  oldPayToday?: string;
  monthlyCost: string;
  oldMonthlyCost?: string;
  discountLabel: string;
  discountValue: string;
  raw?: ProductApiItem;
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
  boilerFeatures?: Array<{ title?: string; details?: string; value?: string } | string>;
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

function TagBadge({ label, blue = false }: { label: string; blue?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-[32px] items-center rounded-full px-4 text-[14px] font-medium",
        blue ? "bg-[#6EC1F3] text-[#2D3D4D]" : "bg-[#F5D64E] text-[#2D3D4D]"
      )}
    >
      {label}
    </span>
  );
}

function SpecIcon({
  type,
}: {
  type?: "warranty" | "flow" | "heat" | "size";
}) {
  if (type === "warranty") return <ShieldCheck className="h-4 w-4 text-[#64748B]" />;
  if (type === "flow") return <CircleDollarSign className="h-4 w-4 text-[#64748B]" />;
  if (type === "heat") return <Flame className="h-4 w-4 text-[#64748B]" />;
  if (type === "size") return <Ruler className="h-4 w-4 text-[#64748B]" />;
  return null;
}

const isValidImageSrc = (src?: string) => {
  if (!src) return false;
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0";
  }
  return `$${value.toLocaleString("en-US")}`;
};

const buildBulletList = (
  features?: Array<{ title?: string; details?: string; value?: string } | string>
) => {
  if (!Array.isArray(features) || features.length === 0) {
    return [];
  }
  return features
    .map((feature) => {
      if (typeof feature === "string") return feature;
      const title = feature?.title?.trim() ?? "";
      const details = feature?.value?.trim() ?? feature?.details?.trim() ?? "";
      if (title && details) return `${title}: ${details}`;
      return title || details;
    })
    .filter(Boolean);
};

function ProductCardSkeleton() {
  return (
    <div className="h-[576px] rounded-[4px] border border-[#00A56F] bg-white p-4 lg:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="h-7 w-2/3 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-8 w-24 animate-pulse rounded-full bg-[#E5E7EB]"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col items-center xl:col-span-4">
          <div className="flex h-[290px] w-full items-center justify-center rounded-[8px] bg-[#F4F7F9]">
            <div className="h-[220px] w-[220px] animate-pulse rounded-[12px] bg-[#E5E7EB]" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[10px] w-[10px] animate-pulse rounded-full bg-[#E5E7EB]"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-[8px] border border-[#94A3B8] p-5">
            <div className="h-6 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-full animate-pulse rounded-[6px] bg-[#F0F3F6]"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#94A3B8] p-5">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="h-4 w-1/3 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                  <div className="h-4 w-1/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#F0F3F6] p-5 xl:col-span-4">
          <div className="h-5 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-[8px] bg-white p-4">
                <div className="h-4 w-1/2 animate-pulse rounded-[6px] bg-[#F0F3F6]" />
                <div className="mt-2 h-7 w-3/4 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-[50px] animate-pulse rounded-[8px] bg-white" />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = item.images.length > 0 ? item.images : ["/hitterpng.png"];

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="h-[576px] rounded-[4px] border border-[#00A56F] bg-white p-4 lg:p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <h3 className="text-[24px] font-bold leading-tight text-[#2D3D4D]">
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {item.tags.map((tag, idx) => (
            <TagBadge key={tag} label={tag} blue={idx === item.tags.length - 1} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col items-center xl:col-span-4">
          <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-transparent">
            <Image
              src={images[activeImage]}
              alt={item.title}
              width={1000}
              height={1000}
              className="relative z-10 h-[320px] w-full object-contain drop-shadow-[0_18px_35px_rgba(15,23,42,0.18)]"
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  "h-[10px] w-[10px] rounded-full transition",
                  index === activeImage ? "bg-[#00A56F]" : "bg-[#D9DEE4]"
                )}
              />
            ))}
            <button
              type="button"
              onClick={nextImage}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] xl:inline-flex"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-[8px] border border-[#94A3B8] p-5">
            <h4 className="text-[24px] font-semibold text-[#2D3D4D]">
              {item.subtitle}
            </h4>

            <div className="mt-4 space-y-3">
              {item.bullets.map((bullet) => (
                <p key={bullet} className="text-[16px] text-[#2D3D4D]">
                  {bullet}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#94A3B8] p-5">
            <div className="space-y-4">
              {item.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-[16px] text-[#2D3D4D]">{spec.label}</span>

                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-medium text-[#2D3D4D]">
                      {spec.value}
                    </span>
                    <SpecIcon type={spec.icon} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#F0F3F6] p-5 xl:col-span-4">
          <h4 className="mb-5 text-center text-[20px] font-medium text-[#2D3D4D]">
            Your fixed price including installation:
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[8px] bg-white p-4">
              <p className="text-[16px] text-[#2D3D4D]">Pay today</p>
              <p className="mt-2 text-[24px] font-bold leading-none text-[#2D3D4D]">
                {item.payToday}
              </p>
              {item.oldPayToday ? (
                <p className="mt-2 text-[14px] font-medium text-[#00A56F] line-through">
                  {item.oldPayToday}
                </p>
              ) : null}
            </div>

            <div className="rounded-[8px] bg-white p-4">
              <p className="text-[16px] text-[#2D3D4D]">Monthly Cost</p>
              <p className="mt-2 text-[24px] font-bold leading-none text-[#2D3D4D]">
                {item.monthlyCost}
              </p>
              {item.oldMonthlyCost ? (
                <p className="mt-2 text-[14px] font-medium text-[#00A56F] line-through">
                  {item.oldMonthlyCost}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex h-[50px] items-center justify-center rounded-[8px] bg-white px-4">
            <BadgePercent className="mr-2 h-5 w-5 text-[#64748B]" />
            <span className="text-[20px] font-semibold text-[#2D3D4D]">
              {item.discountLabel}
            </span>
            <span className="ml-3 text-[18px] font-semibold text-[#00A56F]">
              {item.discountValue}
            </span>
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
      const payTodayValue =
        item.payablePrice ?? item.discountPrice ?? item.price ?? 0;
      const basePrice = item.price ?? payTodayValue;
      const monthlyPrice = item.monthlyPrice ?? 0;
      const discountDelta =
        typeof basePrice === "number" && typeof payTodayValue === "number"
          ? Math.max(basePrice - payTodayValue, 0)
          : 0;

      const rawBullets = buildBulletList(item.boilerFeatures);
      const fallbackBullet = item.shortDescription ?? item.description ?? "";
      const bullets =
        rawBullets.length > 0
          ? rawBullets
          : fallbackBullet
            ? [fallbackBullet]
            : [];

      const specs: ProductItem["specs"] = [
        {
          label: "Boiler Ability",
          value: item.boilerAbility ?? "N/A",
          icon: "size",
        },
        {
          label: "Payable Price",
          value: formatCurrency(payTodayValue),
          icon: "flow",
        },
        {
          label: "Monthly Price",
          value: formatCurrency(monthlyPrice),
          icon: "heat",
        },
        {
          label: "Discount Price",
          value: formatCurrency(item.discountPrice ?? payTodayValue),
          icon: "warranty",
        },
      ];

      return {
        id: item._id,
        systemName: "System - 01",
        productLabel: `Product ${String(index + 1).padStart(3, "0")}`,
        title: item.title,
        tags: item.badges ?? [],
        images:
          item.images?.filter((src) => isValidImageSrc(src))?.length
            ? item.images.filter((src) => isValidImageSrc(src))
            : ["/hitterpng.png"],
        subtitle: item.shortDescription ?? item.description ?? "",
        bullets,
        specs,
        payToday: formatCurrency(payTodayValue),
        oldPayToday:
          basePrice && basePrice !== payTodayValue
            ? `was ${formatCurrency(basePrice)}`
            : undefined,
        monthlyCost: formatCurrency(monthlyPrice),
        oldMonthlyCost: undefined,
        discountLabel: item.boilerAbility
          ? `${item.boilerAbility} Discount`
          : "Discount",
        discountValue:
          discountDelta > 0
            ? `-$${discountDelta.toLocaleString("en-US")}`
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
              <div className="flex items-center gap-4">
                <span className="inline-flex h-[40px] min-w-[140px] items-center justify-center rounded-[8px] bg-[#F5D64E] px-5 text-[15px] font-medium text-[#2D3D4D]">
                  Boiler Systems
                </span>
              </div>

              <Button
                onClick={() => setOpenAddBoiler(true)}
                className="h-[48px] rounded-[8px] bg-[#F5D64E] px-6 text-[16px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
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
                className="h-[40px] rounded-[10px] bg-[#F5D64E] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
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
