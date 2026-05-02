"use client";

import { useEffect, useState, type ElementType } from "react";
import {  useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import {
  BadgeCheck,
  BadgeDollarSign,
  BadgePercent,
  Box,
  CalendarDays,
  CreditCard,
  Crown,
  Gift,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ApiProductFull, useProductById } from "../../controller/_components/useProductById";
import { getPrimaryQuotePriceAdjustmentItem, getQuotePriceAdjustmentTotal, QuotePriceAdjustmentItem } from "../../product/_components/getQuotePriceAdjustmentItems";
import { ApiQuoteController, ApiQuoteExtra, useQuoteById } from "../../controller/_components/useQuoteById";
import { getBrowserPageUrl, sendQuoteEmail } from "../../product/_components/sendQuoteEmail";

type IncludedItem = {
  icon: ElementType;
  title: string;
  subtitle?: string;
  price: string;
  oldPrice?: string;
  image?: string;
};

const includeIcons: ElementType[] = [Package, Trash2, BadgeDollarSign];
const DEFAULT_VISIBLE_INCLUDE_ITEMS = 6;

const accordions = [
  { icon: CalendarDays, label: "When should we Survey?" },
  { icon: CalendarDays, label: "When should we install?" },
  { icon: MapPin, label: "Where are we visiting?" },
  { icon: CreditCard, label: "How would you like to pay?" },
];

function formatMoney(value: number): string {
  if (value % 1 === 0) return `£${value.toLocaleString("en-US")}`;
  return `£${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddonPrice(price: number): string {
  if (price <= 0) return "Include";
  return `£${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

function getWarrantyText(product: ApiProductFull): string | undefined {
  const warrantyFeature = product.boilerFeatures.find((f) => /warranty/i.test(f.title));
  if (!warrantyFeature?.value) return undefined;
  return `with ${warrantyFeature.value} warranty`;
}

function buildIncludedItems(
  product: ApiProductFull,
  controller: ApiQuoteController | null,
  extra: ApiQuoteExtra | null,
  quotePriceItem: QuotePriceAdjustmentItem | null
): IncludedItem[] {
  const items: IncludedItem[] = [
    {
      icon: ShieldCheck,
      title: product.boilerAbility || product.title,
      subtitle: getWarrantyText(product),
      price: formatMoney(product.payablePrice ?? product.price ?? 0),
      oldPrice: product.price > product.payablePrice ? formatMoney(product.price) : undefined,
      image: product.images?.[0] ?? "/product.png",
    },
  ];

  if (controller) {
    items.push({
      icon: Wrench,
      title: controller.title,
      subtitle: "Selected controller",
      price: formatAddonPrice(controller.price ?? 0),
      image: controller.images?.[0] ?? "/product.png",
    });
  }

  if (extra) {
    items.push({
      icon: Box,
      title: extra.title,
      subtitle: "Selected extra",
      price: formatAddonPrice(extra.price ?? 0),
      image: extra.images?.[0] ?? "/product.png",
    });
  }

  if (quotePriceItem) {
    items.push({
      icon: BadgeDollarSign,
      title: quotePriceItem.label,
      subtitle: "Quote adjustment",
      price: formatMoney(quotePriceItem.price),
    });
  }

  const includedLines = (product.boilerIncludedData ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  includedLines.forEach((line, index) => {
    items.push({
      icon: includeIcons[index % includeIcons.length],
      title: line,
      price: "Include",
    });
  });

  return items;
}

function FeaturePill({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="flex min-h-[60px] items-center gap-2 rounded-[4px] bg-[#00A56F] px-3 text-white">
      <Icon className="h-5 w-5 shrink-0" />
      <span className=" text-base lg:text-[18px] font-medium leading-[1.2]">{text}</span>
    </div>
  );
}

function InstallItem({ item, showImage }: { item: IncludedItem; showImage: boolean }) {
  const Icon = item.icon;

  return (
    <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
      {showImage ? (
        <div className="h-12 w-12 overflow-hidden">
          <Image
            src={item.image ?? "/product.png"}
            alt={item.title}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center text-[#64748B]">
          <Icon className="h-6 w-6" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-sm lg:text-[16px] font-medium text-[#2D3D4D]">{item.title}</p>
        {item.subtitle ? (
          <p className="mt-1 text-[14px] text-[#64748B]">{item.subtitle}</p>
        ) : null}
      </div>

      <div className="text-right">
        <p className="text-[16px] font-semibold text-[#2D3D4D]">{item.price}</p>
        {item.oldPrice ? (
          <p className="mt-1 text-[14px] font-medium text-[#00A56F] line-through">{item.oldPrice}</p>
        ) : null}
      </div>
    </div>
  );
}

function AccordionRow({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <button
      type="button"
      className="flex h-[70px] w-full items-center justify-center rounded-[8px] bg-white px-4 text-center shadow-sm transition hover:bg-[#F8FAFC]"
    >
      <div className="flex items-center justify-center gap-3 text-[#2D3D4D]">
        <Icon className="h-4 w-4 text-[#64748B]" />
        <span className="text-[16px] font-medium">{label}</span>
      </div>
    </button>
  );
}

function SummaryCard({
  product,
  payTodayTotal,
  originalTotal,
}: {
  product: ApiProductFull;
  controller: ApiQuoteController | null;
  extra: ApiQuoteExtra | null;
  payTodayTotal: number;
  originalTotal: number;
  quotePriceItem: QuotePriceAdjustmentItem | null;
}) {
  return (
    <div className="h-fit rounded-[8px] bg-white p-3 shadow-sm xl:sticky xl:top-5">
      <h3 className="text-[18px] font-semibold text-[#2D3D4D]">Total fixed price including VAT</h3>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[6px] bg-[#F0F3F6] p-2.5">
          <p className="text-[18px] text-[#64748B]">Pay today</p>
          <p className="mt-1 text-[18px] font-bold leading-none text-[#2D3D4D]">{formatMoney(payTodayTotal)}</p>
          {originalTotal > payTodayTotal ? (
            <p className="mt-1 text-[14px] font-medium text-[#00A56F] line-through">
              was {formatMoney(originalTotal)}
            </p>
          ) : null}
        </div>

        <div className="rounded-[6px] bg-[#F0F3F6] p-2.5">
          <p className="text-[18px] text-[#64748B]">Monthly Cost</p>
          <p className="mt-1 text-[18px] font-bold leading-none text-[#2D3D4D]">
            {formatMoney(payTodayTotal / 12)}/mo
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-h-[34px] items-center justify-center rounded-[6px] bg-[#F0F3F6] px-2 text-center">
        <BadgePercent className="mr-2 h-5 w-5 shrink-0 text-[#64748B]" />
        <span className="text-[16px] font-semibold text-[#2D3D4D]">
          {product.boilerAbility || product.title} Discount
        </span>
        <span className="ml-2 text-[16px] font-semibold text-[#00A56F]">-{formatMoney(product.discountPrice)}</span>
      </div>

      <div className="mt-3">
        <h4 className="text-[18px] font-semibold text-[#2D3D4D]">Order Summary</h4>
        <div className="mt-2 space-y-2 rounded-[6px] bg-[#F0F3F6] p-2.5">
          <div className="flex items-center gap-3">
            <div className="h-[48px] w-[48px] overflow-hidden">
              <Image
                src={product.images?.[0] ?? "/product.png"}
                alt={product.boilerAbility || product.title}
                width={48}
                height={48}
                className="h-[48px] w-[48px] object-contain"
              />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-[#2D3D4D]">{product.boilerAbility || product.title}</p>
              {getWarrantyText(product) ? (
                <p className="text-[16px] text-[#2D3D4D]">{getWarrantyText(product)}</p>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function BoilerQuoteSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-4">
        <div className="rounded-[8px] bg-white p-3 shadow-sm sm:p-4 animate-pulse">
          <div className="mx-auto h-7 w-72 rounded bg-[#F0F3F6]" />
          <div className="mx-auto mt-2 h-5 w-[85%] rounded bg-[#F0F3F6]" />

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[60px] rounded-[4px] bg-[#E6EEF3]" />
            ))}
          </div>

          <div className="mt-4 rounded-[8px] bg-[#F0F3F6] p-4">
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[26px_1fr_auto] gap-3">
                  <div className="h-6 w-6 rounded bg-[#E2E8F0]" />
                  <div className="h-5 rounded bg-[#E2E8F0]" />
                  <div className="h-5 w-20 rounded bg-[#E2E8F0]" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 h-10 w-full rounded-[4px] bg-[#E2E8F0]" />
          <div className="mt-4 h-10 w-full rounded-[4px] bg-[#E2E8F0]" />
        </div>

        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[70px] w-full rounded-[8px] bg-white shadow-sm animate-pulse" />
          ))}
        </div>
      </section>

      <div className="rounded-[8px] bg-white p-3 shadow-sm animate-pulse">
        <div className="h-6 w-60 rounded bg-[#F0F3F6]" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-24 rounded-[6px] bg-[#F0F3F6]" />
          <div className="h-24 rounded-[6px] bg-[#F0F3F6]" />
        </div>
        <div className="mt-3 h-9 rounded-[6px] bg-[#F0F3F6]" />
        <div className="mt-3 h-24 rounded-[6px] bg-[#F0F3F6]" />
      </div>
    </div>
  );
}

export default function BoilerQuote() {
  const searchParams = useSearchParams();
  const [showAllIncludedItems, setShowAllIncludedItems] = useState(false);
  const quoteId = searchParams.get("quoteId");
  const productIdFromQuery = searchParams.get("productId");
  const { mutateAsync: mutateEmailQuote, isPending: isEmailingQuote } = useMutation({
    mutationKey: ["email-quote"],
    mutationFn: sendQuoteEmail,
  });

  const { data: quote, isLoading: quoteLoading } = useQuoteById(quoteId);
  const quoteProductId =
    typeof quote?.productId === "string" ? quote.productId : quote?.productId?._id ?? null;
  const resolvedProductId = productIdFromQuery ?? quoteProductId;
  useEffect(() => {
    setShowAllIncludedItems(false);
  }, [resolvedProductId, quoteId]);

  const { data: product, isLoading: productLoading } = useProductById(resolvedProductId);

  const selectedController =
    quote?.controller && typeof quote.controller !== "string" ? quote.controller : null;
  const selectedExtra = quote?.extra && typeof quote.extra !== "string" ? quote.extra : null;

  const selectedControllerPrice =
    selectedController && typeof selectedController.price === "number" && selectedController.price > 0
      ? selectedController.price
      : 0;
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

  const includedItems = product
    ? buildIncludedItems(product, selectedController, selectedExtra, quotePriceItem)
    : [];
  const hasMoreIncludedItems = includedItems.length > DEFAULT_VISIBLE_INCLUDE_ITEMS;
  const visibleIncludedItems = showAllIncludedItems
    ? includedItems
    : includedItems.slice(0, DEFAULT_VISIBLE_INCLUDE_ITEMS);
  const isLoading = (quoteId ? quoteLoading : false) || (resolvedProductId ? productLoading : false);



  const handleSaveQuote = async () => {
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

  return (
    <div>
      <div className="py-12">
        <div className="mx-auto container">
          {isLoading ? (
            <BoilerQuoteSkeleton />
          ) : !product ? (
            <div className="rounded-[8px] bg-white p-5 text-[15px] text-[#2D3D4D] shadow-sm">
              Product details not found. Please go back and select your boiler again.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="space-y-4">
                <div className="rounded-[8px] bg-white p-3 shadow-sm sm:p-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-[18px] font-bold text-[#2D3D4D]">
                      <Crown className="h-4 w-4" />
                      <span>Your total price is {formatMoney(payTodayTotal)}</span>
                    </div>
                    <p className="mt-1 text-[18px] text-[#2D3D4D]">
                      Installation available from next working day- choose your install date below
                    </p>
                  </div>

                  <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                    <FeaturePill icon={BadgeCheck} text="Every job audited by our technical team" />
                    <FeaturePill icon={Gift} text="We'll beat any like-for-like quote or give you £50" />
                    <FeaturePill icon={Star} text="Were rated Excellent on Trustpilot." />
                  </div>

                  <div className="mt-3 rounded-[8px] bg-[#F0F3F6] p-4">
                    <div className="space-y-6">
                      {visibleIncludedItems.map((item, index) => (
                        <InstallItem
                          key={`${item.title}-${item.price}`}
                          item={item}
                          showImage={index < 3}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (hasMoreIncludedItems) {
                        setShowAllIncludedItems((prev) => !prev);
                      }
                    }}
                    className="mt-6 hover:underline flex w-full items-center justify-center gap-1.5 rounded-[4px] px-3 py-2 text-sm lg:text-[18px] font-medium text-[#FFDE59]"
                  >
                    <span className="text-sm leading-none">
                      {hasMoreIncludedItems && showAllIncludedItems ? "-" : "+"}
                    </span>
                    <span>
                      {hasMoreIncludedItems && showAllIncludedItems
                        ? "Show less"
                        : "Show everything included in your installation"}
                    </span>
                  </button>

                  <div className="mt-2 space-y-6">
                    {/* <Button
                      type="button"
                      onClick={handleNext}
                      className="h-[48px] w-full rounded-[4px] bg-[#00A56F] text-[18px] font-medium text-white hover:bg-[#00A56F]"
                    >
                      Next
                    </Button> */}
                    <Button
                      variant="outline"
                      disabled={isEmailingQuote}
                      onClick={handleSaveQuote}
                      className="h-[48px] w-full rounded-[4px] border border-[#F5D64E] bg-transparent text-[18px] font-medium text-[#FFDE59] hover:bg-transparent"
                    >
                      {isEmailingQuote ? "Sending..." : "Save this quote"}
                      <Mail className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5 ">
                  {accordions.map((item) => (
                    <AccordionRow key={item.label} icon={item.icon} label={item.label} />
                  ))}
                </div>

                <p className="px-0.5  text-sm lg:text-[16px] leading-5 text-[#2D3D4D]">
                  *Representative example for 120 month order: £3,099 purchase. Deposit £0. Annual rate of interest
                  9.48% p.a. Representative APR: 9.9% APR. Total amount of credit £3,099 paid over 120 months as
                  120 monthly payments of £40.07 at 9.48% p.a. Cost of finance £1,709.40. Total amount payable
                  £4,808.40. BOXT Limited is a credit broker and not a lender. Credit provided by HomeServe Finance
                  Limited. Finance available subject to status, affordability and credit check. Terms and conditions
                  apply.
                </p>
              </section>

              <SummaryCard
                product={product}
                controller={selectedController}
                extra={selectedExtra}
                payTodayTotal={payTodayTotal}
                originalTotal={originalTotal}
                quotePriceItem={quotePriceItem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
