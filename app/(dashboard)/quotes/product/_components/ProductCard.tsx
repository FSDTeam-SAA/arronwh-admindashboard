"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

import {
  ChevronRight,
  BadgePercent,
  ShieldCheck,
  Flame,
  Ruler,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductItem = {
  id: string | number;
  title: string;
  boilerAbility?: string;
  topBadge?: string;
  badgeBubble?: string;
  tags: string[];
  images: string[];
  summaryTitle: string;
  summaryPoints: string[];
  specs: ProductSpec[];
  payToday: string;
  payTodayOld?: string;
  monthlyCost: string;
  monthlyCostOld?: string;
  discountTitle: string;
  discountValue: string;
  payablePriceValue?: number;
  priceValue?: number;
  discountAmountValue?: number;
  monthlyPriceValue?: number;
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
        "inline-flex h-[38px] items-center justify-center rounded-full px-3 text-[11px] sm:text-[18px] font-medium",
        isFinance ? "bg-[#6EC1F3] text-[#2D3D4D]" : "bg-[#FBFF26] text-[#2D3D4D]"
      )}
    >
      {normalizedLabel}
    </div>
  );
}

function SpecIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("warranty")) return <ShieldCheck className="h-4 w-4 text-[#64748B]" />;
  if (l.includes("flow")) return <CircleDollarSign className="h-4 w-4 text-[#64748B]" />;
  if (l.includes("heating")) return <Flame className="h-4 w-4 text-[#64748B]" />;
  return <Ruler className="h-4 w-4 text-[#64748B]" />;
}

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

export function ProductCard({ product }: { product: ProductItem }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  // const { mutateAsync: mutateEmailQuote, isPending: isEmailingQuote } = useMutation({
  //   mutationKey: ["email-quote", String(product.id)],
  //   mutationFn: sendQuoteEmail,
  // });
  const quoteId = searchParams.get("quoteId");
  // const payTodayPrice = product.payablePriceValue ?? product.priceValue ?? 0;
  const activeImageSrc = product.images[activeImage] || product.images[0] || "/product.png";
  const headingTitle = product.boilerAbility || product.title;
  const discountLabel = formatBoilerAbilityShort(
    product.boilerAbility || product.discountTitle || product.title
  );

  const nextImage = () => {
    if (!product.images.length) return;
    setActiveImage((prev) => (prev + 1) % product.images.length);
  };

  const handleChooseProduct = () => {
    const params = new URLSearchParams();
    params.set("productId", String(product.id));
    if (quoteId) {
      params.set("quoteId", quoteId);
    }

    router.push(`/quotes/controller?${params.toString()}`);
  };


  // const handleSaveQuote = async () => {
  //   if (!quoteId) {
  //     toast.error("Quote ID not found. Please start again.");
  //     return;
  //   }

  //   try {
  //     const result = await mutateEmailQuote({
  //       quoteId,
  //       pageUrl: getBrowserPageUrl(),
  //       price: payTodayPrice,
  //     });
  //     toast.success(result.message || "Quote email sent successfully.");
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Failed to send quote email.");
  //   }
  // };

  return (
    <div className="overflow-hidden rounded-[6px] border border-[#00A56F] bg-white shadow-sm">
      {product.topBadge ? (
        <div className="bg-[#00A56F] py-2 text-center text-[11px] sm:text-[12px] font-semibold tracking-wide text-white">
          {product.topBadge}
        </div>
      ) : null}

      <div className="p-3 sm:p-4 lg:p-5">
        {/* Title + tags */}
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h3 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold leading-tight text-[#2D3D4D]">
            {headingTitle}
          </h3>

          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_34px_minmax(0,1fr)_340px]">
          {/* Left Image Area */}
          <div className="flex flex-col items-center">
            <div className="relative flex min-h-[280px] w-full items-center justify-center rounded-[8px] bg-white">
              <div className="absolute left-1/2 top-1/2 h-[150px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-[#FFD9C7]" />

              {product.badgeBubble ? (
                <div className="absolute right-[18%] top-[24%] z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6A6A] p-2 text-center text-[9px] font-bold leading-tight text-white shadow-md">
                  {product.badgeBubble}
                </div>
              ) : null}

              <Image
                src={activeImageSrc}
                alt={headingTitle}
                width={1000}
                height={1000}
                className="relative z-10 h-[250px] w-auto object-contain sm:h-[370px]"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              {product.images.map((_, index) => (
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

          {/* Arrow */}
          <div className="hidden xl:flex items-center justify-center">
            <button
              onClick={nextImage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2F5] text-[#64748B] transition hover:bg-[#E5EAF0]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Middle content */}
          <div className="space-y-4">
            <div className="rounded-[8px] border-[3px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <h4 className="text-[18px] sm:text-[20px] font-bold leading-snug text-[#2D3D4D]">
                {product.title}
              </h4>

              <div className="mt-3 space-y-2">
                {product.summaryPoints.map((point) => (
                  <p key={point} className="text-[13px] sm:text-[16px] text-[#2D3D4D]">
                    {point}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border-[3px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <div className="space-y-3">
                {product.specs.map((spec) => (
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

          {/* Right pricing box */}
          <div className="rounded-[4px] bg-[#F0F3F6] p-4 sm:p-5">
            <h4 className="mb-4 text-center text-[16px] sm:text-[18px] font-medium text-[#2D3D4D]">
              Your fixed price including installation:
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <p className="text-[12px] sm:text-[16px] text-[#2D3D4D]">Pay today</p>
                <p className="mt-2 text-[24px] sm:text-[18px] font-bold leading-none text-[#2D3D4D]">
                  {product.payToday}
                </p>
                {product.payTodayOld ? (
                  <p className="mt-2 text-[11px] sm:text-[12px] font-medium text-[#00A56F] line-through">
                    {product.payTodayOld}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <p className="text-[12px] sm:text-[16px] text-[#2D3D4D]">Monthly Cost</p>
                <p className="mt-2 text-[24px] sm:text-[18px] font-bold leading-none text-[#2D3D4D]">
                  {product.monthlyCost}
                </p>
                {product.monthlyCostOld ? (
                  <p className="mt-2 text-[11px] sm:text-[12px] font-medium text-[#00A56F] line-through">
                    {product.monthlyCostOld}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex min-h-[48px] items-center justify-center rounded-[8px] bg-white px-3 text-center">
              <BadgePercent className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#64748B]" />
              <span className="text-[14px] sm:text-[16px] font-semibold text-[#2D3D4D]">
                {discountLabel || product.discountTitle}
              </span>
              <span className="ml-2 text-[14px] sm:text-[16px] font-semibold text-[#00A56F]">
                {product.discountValue}
              </span>
            </div>
          
            <Button
              className="mt-4 h-[46px] w-full rounded-[6px] bg-[#00A56F] text-[15px] sm:text-[16px] font-medium text-white hover:bg-[#009562]"
              onClick={handleChooseProduct}
            >
              Choose
            </Button>

            {/* <Button
              variant="outline"
              disabled={isEmailingQuote}
              onClick={handleSaveQuote}
              className="mt-3 h-[46px] w-full rounded-[6px] border border-[#F5D64E] bg-transparent text-[15px] sm:text-[16px] font-medium text-[#F5C842] hover:bg-transparent"
            >
              {isEmailingQuote ? "Sending..." : "Save this quote"}
            </Button> */}
          </div>
        </div>
      </div>

   
    </div>
  );
}
