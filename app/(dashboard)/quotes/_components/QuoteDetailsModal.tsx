"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type QuizAnswer = {
  question: string;
  answer: string;
};

type QuoteSelectableItem = {
  _id: string;
  title?: string;
  price?: number;
  discount?: number;
  payablePrice?: number;
  monthlyPrice?: number;
};

type PersonalInfo = {
  title?: string;
  fastName?: string;
  sureName?: string;
  email?: string;
  mobleNumber?: string;
  postcode?: string;
};

type PayMonthlyData = {
  deposit?: number;
  mounthNumber?: number;
  amount?: number;
  _id?: string;
};

type QuoteDetails = {
  _id: string;
  productId?: QuoteSelectableItem | string | null;
  quizAnswers?: QuizAnswer[];
  personalInfo?: PersonalInfo;
  controller?: QuoteSelectableItem | null;
  extra?: QuoteSelectableItem | null;
  surveyDate?: string;
  installDate?: string;
  installAddress?: string;
  payByCard?: boolean;
  payMounthly?: boolean;
  payMounthlyData?: PayMonthlyData;
  createdAt?: string;
  updatedAt?: string;
};

type QuoteDetailsApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: QuoteDetails;
};

interface QuoteDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string | null;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    ""
  );
}

function getFullName(personalInfo?: PersonalInfo): string {
  if (!personalInfo) return "N/A";

  const title = personalInfo.title?.trim() || "";
  const firstName = personalInfo.fastName?.trim() || "";
  const lastName = personalInfo.sureName?.trim() || "";
  const fullName = `${title} ${firstName} ${lastName}`.trim();

  return fullName || "N/A";
}

function formatDateTime(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `£${value.toLocaleString()}`;
}

function getItemTitle(item?: QuoteSelectableItem | string | null): string {
  if (!item) return "Not selected";
  if (typeof item === "string") return item;
  return item.title?.trim() || "Not selected";
}

function getItemPrice(item?: QuoteSelectableItem | string | null): string {
  if (!item || typeof item === "string") return "N/A";
  const payable = typeof item.payablePrice === "number" ? item.payablePrice : item.price;
  return formatCurrency(payable);
}

function QuoteDetailsSkeleton() {
  return (
    <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-4 py-4 sm:px-5">
      <div className="rounded-[8px] bg-[#F0F3F6] p-4">
        <div className="mb-4 h-8 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[8px] bg-[#00A56F] px-3 py-2 text-white opacity-75"
            >
              <div className="h-4 w-11/12 animate-pulse rounded bg-white/35" />
              <div className="mt-2 h-6 w-7/12 animate-pulse rounded bg-white/35" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-6 h-8 w-52 animate-pulse rounded-md bg-gray-200" />
        <div className="rounded-[8px] border-b border-[#2D3D4D] bg-white">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3 last:border-b-0"
            >
              <div className="h-4 w-40 animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-28 animate-pulse rounded-md bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-[48px] w-full animate-pulse rounded-[4px] bg-[#FFDE59]/70" />
        <div className="h-[48px] w-full animate-pulse rounded-[4px] bg-[#00A56F]/70" />
      </div>
    </div>
  );
}

async function fetchQuoteById(id: string): Promise<QuoteDetailsApiResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
    );
  }

  const response = await fetch(`${baseUrl}/quote/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch quote details: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as QuoteDetailsApiResponse;

  if (!json.success) {
    throw new Error(json.message || "Failed to fetch quote details.");
  }

  return json;
}

export function QuoteDetailsModal({
  open,
  onOpenChange,
  quoteId,
}: QuoteDetailsModalProps) {
  const { data, isLoading, isError, error, isFetching } = useQuery<
    QuoteDetailsApiResponse,
    Error
  >({
    queryKey: ["quote", quoteId],
    queryFn: () => fetchQuoteById(quoteId as string),
    enabled: open && !!quoteId,
  });

  if (!quoteId) return null;

  const quote = data?.data;
  const showSkeleton = isLoading || (isFetching && !quote);
  const paymentMethod = quote
    ? quote.payByCard
      ? "Pay by card"
      : quote.payMounthly
      ? "Pay monthly"
      : "Not specified"
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[1400px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[14px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-[#EEF2F5] px-5 py-4">
            <DialogTitle className="text-[28px] font-semibold text-[#2D3D4D]">
              Generated Quote Details
            </DialogTitle>
          </div>

          {showSkeleton ? (
            <QuoteDetailsSkeleton />
          ) : isError || !quote ? (
            <div className="flex h-64 items-center justify-center px-4 text-center text-red-600">
              Failed to load quote details
              {error?.message ? `: ${error.message}` : ""}
            </div>
          ) : (
            <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="rounded-[8px] bg-[#F0F3F6] p-4">
                <h3 className="mb-4 text-[28px] font-semibold text-[#2D3D4D]">
                  Personal Details
                </h3>

                <div className="grid grid-cols-1 gap-3 text-[16px] text-[#2D3D4D] sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{getFullName(quote.personalInfo)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#64748B]" />
                    <span>{quote.personalInfo?.email || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#64748B]" />
                    <span>{quote.personalInfo?.mobleNumber || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#64748B]" />
                    <span>
                      {quote.installAddress || quote.personalInfo?.postcode || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="mb-6 text-[28px] font-semibold text-[#2D3D4D]">
                  Quiz Answers
                </h3>

                {(quote.quizAnswers ?? []).length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(quote.quizAnswers ?? []).map((item, index) => (
                      <div
                        key={`${item.question}-${index}`}
                        className="rounded-[8px] bg-[#00A56F] px-3 py-2 text-white"
                      >
                        <p className="text-[14px] leading-[1.35] font-medium">
                          {item.question}
                        </p>
                        <p className="mt-2 text-[18px] font-bold">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[8px] bg-[#F4F7F9] px-4 py-6 text-center text-[14px] text-[#64748B]">
                    No quiz answers found.
                  </div>
                )}
              </div>

              <div className="mt-5">
                <h3 className="mb-6 text-[28px] font-semibold text-[#2D3D4D]">
                  Option chosen
                </h3>

                <div className="rounded-[8px] border-b border-[#2D3D4D] bg-white">
                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Product</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote.productId)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Product Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote.productId)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Controller</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote.controller)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Controller Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote.controller)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Extra</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote.extra)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Extra Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote.extra)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Survey Date</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDate(quote.surveyDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Install Date</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDate(quote.installDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Payment</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Monthly Plan</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {quote.payMounthlyData
                        ? `Deposit ${formatCurrency(quote.payMounthlyData.deposit)} • ${quote.payMounthlyData.mounthNumber ?? 0} months • ${formatCurrency(quote.payMounthlyData.amount)}/month`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Install Address</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {quote.installAddress || quote.personalInfo?.postcode || "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Created At</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDateTime(quote.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Button className="h-[48px] w-full rounded-[4px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]">
                  Email quote via email
                </Button>

                <Button className="h-[48px] w-full rounded-[4px] bg-[#00A56F] text-[16px] font-semibold text-white hover:bg-[#009562]">
                  Call Your customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
