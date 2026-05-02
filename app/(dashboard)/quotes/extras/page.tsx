"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { BadgePercent, Mail } from "lucide-react";
import { toast } from "sonner";


import { ExtraCard, ExtraCardSkeleton } from "./_components/ExtraCard";
import { useExtras } from "./_components/useExtras";
import { useProductById } from "../controller/_components/useProductById";
import { useQuoteById } from "../controller/_components/useQuoteById";
import { getPrimaryQuotePriceAdjustmentItem, getQuotePriceAdjustmentTotal } from "../product/_components/getQuotePriceAdjustmentItems";
import { getBrowserPageUrl, sendQuoteEmail } from "../product/_components/sendQuoteEmail";

type UpdateExtraResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type QuoteItem = {
  label: string;
  value: string;
  highlight: boolean;
  onClick?: () => void;
};

function resolveQuoteEndpoint(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/quote`;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/quote`;
  }
  return "/quote";
}

async function updateQuoteExtra({
  quoteId,
  extraId,
}: {
  quoteId: string;
  extraId: string;
}): Promise<UpdateExtraResponse> {
  const response = await fetch(`${resolveQuoteEndpoint()}/${encodeURIComponent(quoteId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      extra: extraId,
    }),
  });

  const result = (await response.json().catch(() => null)) as UpdateExtraResponse | null;
  const hasExplicitFailure = result?.success === false || result?.status === false;

  if (!response.ok || hasExplicitFailure) {
    throw new Error(result?.message || "Failed to update extra.");
  }

  return result ?? {};
}

function formatMoney(value: number): string {
  if (value % 1 === 0) return `£${value.toLocaleString("en-US")}`;
  return `£${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatControllerPrice(price: number): string {
  if (price <= 0) return "Included";
  return `£${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

function ExtrasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdFromQuery = searchParams.get("productId");
  const quoteId = searchParams.get("quoteId");
  const { mutateAsync: mutateExtra, isPending: isUpdatingExtra } = useMutation({
    mutationKey: ["update-quote-extra"],
    mutationFn: updateQuoteExtra,
  });
  const { mutateAsync: mutateEmailQuote, isPending: isEmailingQuote } = useMutation({
    mutationKey: ["email-quote"],
    mutationFn: sendQuoteEmail,
  });

  const { data: extras = [], isLoading: extrasLoading } = useExtras();
  const { data: quote, isLoading: quoteLoading } = useQuoteById(quoteId);

  const quoteProduct =
    quote?.productId && typeof quote.productId !== "string" ? quote.productId : null;
  const quoteProductId =
    typeof quote?.productId === "string" ? quote.productId : quote?.productId?._id ?? null;
  const resolvedProductId = productIdFromQuery ?? quoteProductId;
  const { data: fallbackProduct, isLoading: fallbackProductLoading } = useProductById(
    quoteProduct ? null : resolvedProductId
  );

  const product = quoteProduct ?? fallbackProduct ?? null;
  const productLoading = quoteLoading || (!quoteProduct && fallbackProductLoading);

  const selectedController =
    quote?.controller && typeof quote.controller !== "string" ? quote.controller : null;
  const selectedControllerPrice = selectedController && selectedController.price && selectedController.price > 0
    ? selectedController.price
    : 0;
  const preselectedExtraId =
    typeof quote?.extra === "string" ? quote.extra : quote?.extra?._id ?? null;
  const preselectedExtra =
    quote?.extra && typeof quote.extra !== "string" ? quote.extra : null;

  const [selectedExtraId, setSelectedExtraId] = useState<string | null>(null);
  const hasHydratedInitialExtra = useRef(false);

  useEffect(() => {
    if (hasHydratedInitialExtra.current || quoteLoading) {
      return;
    }

    hasHydratedInitialExtra.current = true;
    if (preselectedExtraId) {
      setSelectedExtraId(preselectedExtraId);
    }
  }, [preselectedExtraId, quoteLoading]);

  const selectedExtraFromList = extras.find((item) => item._id === selectedExtraId) ?? null;
  const selectedExtra =
    selectedExtraFromList ||
    (selectedExtraId && preselectedExtra && preselectedExtraId === selectedExtraId
      ? preselectedExtra
      : null);

  const selectedExtraPrice =
    selectedExtra && typeof selectedExtra.price === "number" && selectedExtra.price > 0
      ? selectedExtra.price
      : 0;
  const quotePriceAdjustment = getQuotePriceAdjustmentTotal(quote?.quizAnswers);
  const quotePriceItem = getPrimaryQuotePriceAdjustmentItem(quote?.quizAnswers);

  const payTodayTotal = product
    ? (product.payablePrice ?? product.price ?? 0) +
      selectedControllerPrice +
      selectedExtraPrice +
      quotePriceAdjustment
    : 0;
  const originalTotal = product
    ? (product.price ?? 0) + selectedControllerPrice + selectedExtraPrice + quotePriceAdjustment
    : 0;
  const monthlyCost = payTodayTotal / 12;



  function handleSelectExtra(id: string) {
    setSelectedExtraId((prev) => (prev === id ? null : id));
  }

  const handleNextCheckout = async () => {
    if (!selectedExtraId) {
      toast.error("Please select an extra before continuing.");
      return;
    }

    if (!quoteId) {
      toast.error("Quote ID not found. Please start again.");
      return;
    }

    try {
      await mutateExtra({
        quoteId,
        extraId: selectedExtraId,
      });

      if (!resolvedProductId) {
        toast.error("Product ID not found. Please start again.");
        return;
      }

      const params = new URLSearchParams();
      params.set("quoteId", quoteId);
      params.set("productId", resolvedProductId);
      router.push(`/quotes/customer-details?${params.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update extra.");
    }
  };

  const handleEmailQuote = async () => {
    if (!quoteId) {
      toast.error("Quote ID not found. Please start again.");
      return;
    }

    try {
      const result = await mutateEmailQuote({
        quoteId,
        pageUrl: getBrowserPageUrl(),
        price: payTodayTotal,
      });
      toast.success(result.message || "Quote email sent successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send quote email.");
    }
  };

  const quoteItems: QuoteItem[] = product
    ? [
        {
          label: product.boilerAbility || product.title,
          value: formatMoney(product.price ?? 0),
          highlight: false,
        },
        // { label: "View details", value: "", highlight: true, onClick: handleViewDetails },
        ...(selectedController
          ? [
              {
                label: selectedController.title,
                value: formatControllerPrice(selectedController.price ?? 0),
                highlight: false,
              },
            ]
          : []),
        ...(selectedExtra
          ? [
              {
                label: selectedExtra.title,
                value: formatControllerPrice(selectedExtraPrice),
                highlight: false,
              },
            ]
          : []),
        ...(quotePriceItem
          ? [
              {
                label: quotePriceItem.label,
                value: formatMoney(quotePriceItem.price),
                highlight: false,
              },
            ]
          : []),
        ...(product.boilerFeatures ?? [])
          .map((f) => ({
            label: f.title ?? "",
            value: f.value ?? "",
            highlight: false,
          }))
          .filter((f) => f.label && f.value),
        ...(product.boilerIncludedData ?? "")
          .split("\n")
          .filter(Boolean)
          .map((line) => ({ label: line.trim(), value: "Included", highlight: false })),
      ]
    : [];

  return (
    <div>
   
      <div className="min-h-screen bg-[#EEF2F5] px-1 py-5 sm:px-0 lg:px-6">
        <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-[24px] sm:text-[30px] lg:text-[34px] font-bold leading-tight text-[#2D3D4D]">
            Add extras to your order
          </h1>
          <p className="mt-2 text-[12px] sm:text-[16px] text-[#2D3D4D]">
            All extras are installed at the same time as your boiler
            <br className="hidden sm:block" />
            for no extra cost.
          </p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Left content */}
          <div className="space-y-6">
            {/* Extras Section */}
            <section>
              <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2D3D4D]">
                Extras
              </h2>
              <p className="mt-1 text-[13px] sm:text-[16px] text-[#2D3D4D]">
                Enhance and protect your system for improved efficiency and longevity.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {extrasLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <ExtraCardSkeleton key={i} />
                    ))
                  : extras.map((item) => (
                      <ExtraCard
                        key={item._id}
                        item={item}
                        isSelected={selectedExtraId === item._id}
                        onSelect={handleSelectExtra}
                      />
                    ))}
              </div>
            </section>

            {/* Footer note */}
            <p className="text-[11px] sm:text-[16px] leading-5 text-[#2D3D4D]">
              *Representative example for 120 month order: £4,282 purchase. Deposit £0. Annual rate of interest 9.48% p.a.
              Representative APR: 9.9% APR. Total amount of credit £4,282 paid over 120 months as 120 monthly payments of
              £55.36 at 9.48% p.a. Cost of finance £2,361.20. Total amount payable £6,643.20. BOXT Limited is a credit broker
              and not a lender. Credit provided by HomeServe Finance Limited. Finance available subject to status, affordability
              and a credit check. Terms and conditions apply.
            </p>
          </div>

          {/* Right summary */}
          {productLoading ? (
            <div className="h-fit rounded-[4px] bg-[#FFFFFF] p-4 sm:p-5 xl:sticky xl:top-5 animate-pulse">
              <div className="mb-4 h-5 w-[75%] rounded bg-[#F0F3F6]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4 space-y-2">
                  <div className="h-4 w-[60%] rounded bg-[#E5EAF0]" />
                  <div className="h-7 w-[55%] rounded bg-[#E5EAF0]" />
                  <div className="h-3 w-[50%] rounded bg-[#E5EAF0]" />
                </div>
                <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4 space-y-2">
                  <div className="h-4 w-[60%] rounded bg-[#E5EAF0]" />
                  <div className="h-7 w-[55%] rounded bg-[#E5EAF0]" />
                  <div className="h-3 w-[50%] rounded bg-[#E5EAF0]" />
                </div>
              </div>
              <div className="mt-4 h-[48px] w-full rounded-[8px] bg-[#F0F3F6]" />
              <div className="mt-4 h-[48px] w-full rounded-[6px] bg-[#F0F3F6]" />
              <div className="mt-3 h-[48px] w-full rounded-[6px] bg-[#F0F3F6]" />
              <div className="mt-5 space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 border-b border-dotted border-[#A7B1BB] py-3 last:border-b-0">
                    <div className="h-4 w-[58%] rounded bg-[#F0F3F6]" />
                    <div className="h-4 w-[22%] rounded bg-[#F0F3F6]" />
                  </div>
                ))}
              </div>
            </div>
          ) : product ? (
            <div className="h-fit rounded-[4px] bg-[#FFFFFF] p-4 sm:p-5 xl:sticky xl:top-5">
              <h3 className="mb-4 text-[18px] font-medium text-[#2D3D4D]">
                Your fixed price including installation:
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4">
                  <p className="text-[12px] sm:text-[16px] text-[#2D3D4D]">Pay today</p>
                  <p className="mt-2 text-[24px] sm:text-[18px] font-bold leading-none text-[#2D3D4D]">
                    {formatMoney(payTodayTotal)}
                  </p>
                  {originalTotal > payTodayTotal && (
                    <p className="mt-2 text-[11px] sm:text-[14px] font-medium text-[#00A56F] line-through">
                      was {formatMoney(originalTotal)}
                    </p>
                  )}
                </div>

                <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4">
                  <p className="text-[12px] sm:text-[16px] text-[#2D3D4D]">Monthly Cost</p>
                  <p className="mt-2 text-[24px] sm:text-[18px] font-bold leading-none text-[#2D3D4D]">
                    {formatMoney(monthlyCost)}/mo
                  </p>
                </div>
              </div>

              <div className="mt-4 flex min-h-[48px] items-center justify-center rounded-[8px] bg-[#F0F3F6] px-3 text-center">
                <BadgePercent className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#64748B]" />
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#2D3D4D] truncate">
                  {product.boilerAbility || product.title}
                </span>
                <span className="ml-2 shrink-0 text-[14px] sm:text-[15px] font-semibold text-[#00A56F]">
                  -£{product.discountPrice ?? 0}
                </span>
              </div>

             

              <Button
                disabled={isUpdatingExtra}
                onClick={handleNextCheckout}
                className="mt-4 h-[48px] w-full rounded-[6px] bg-[#00A56F] text-[15px] sm:text-[16px] font-medium text-white hover:bg-[#009562]"
              >
                {isUpdatingExtra ? "Saving..." : "Next Checkout"}
              </Button>

              <Button
                variant="outline"
                disabled={isEmailingQuote}
                onClick={handleEmailQuote}
                className="mt-3 h-[48px] w-full rounded-[6px] border border-[#F5D64E] bg-transparent text-[15px] sm:text-[16px] font-medium text-[#F5C842] hover:bg-transparent"
              >
                {isEmailingQuote ? "Sending..." : "Email My quote"}
                <Mail className="ml-2 h-4 w-4" />
              </Button>

              {/* Quote items list */}
              <div className="mt-5">
                {quoteItems.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="flex min-w-0 items-start justify-between gap-3 border-b border-dotted border-[#A7B1BB] py-3 last:border-b-0"
                  >
                    {item.highlight ? (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="min-w-0 flex-1 break-words text-left text-[14px] sm:text-[15px] font-medium text-[#F5C842] underline cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <div className="min-w-0 flex-1 break-words text-[14px] sm:text-[15px] text-[#2D3D4D]">
                        {item.label}
                      </div>
                    )}

                    {item.value ? (
                      <div className="max-w-[46%] text-right break-words text-[14px] sm:text-[15px] font-semibold text-[#2D3D4D]">
                        {item.value}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function ExtrasPage() {
  return (
    <Suspense>
      <ExtrasPageContent />
    </Suspense>
  );
}
