"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type PayMonthlyData = {
  deposit?: number;
  mounthNumber?: number;
  amount?: number;
  _id?: string;
};

type PersonalInfo = {
  title?: string;
  fastName?: string;
  sureName?: string;
  email?: string;
  mobleNumber?: string;
  postcode?: string;
};

type Quote = {
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

type BookingItem = {
  _id: string;
  quote?: Quote;
  price?: number;
  status?: "pending" | "confirmed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
  bookingFor?: string;
};

type BookingDetailsApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: BookingItem;
};

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function buildCalendarWeeks(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const startDayIndex = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: Array<Array<number | null>> = [];

  let currentDay = 1;
  for (let week = 0; week < 6; week++) {
    const row: Array<number | null> = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      if (week === 0 && dayIndex < startDayIndex) {
        row.push(null);
      } else if (currentDay > daysInMonth) {
        row.push(null);
      } else {
        row.push(currentDay);
        currentDay++;
      }
    }
    weeks.push(row);
    if (currentDay > daysInMonth) break;
  }
  return weeks;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    ""
  );
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getDateKeyFromIso(value?: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const datePart = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const date = parseDate(trimmed);
  if (!date) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function getFullName(personalInfo?: PersonalInfo): string {
  if (!personalInfo) return "N/A";

  const title = personalInfo.title?.trim() || "";
  const firstName = personalInfo.fastName?.trim() || "";
  const lastName = personalInfo.sureName?.trim() || "";
  const fullName = `${title} ${firstName} ${lastName}`.trim();

  return fullName || "N/A";
}

function formatDate(value?: string): string {
  const dateKey = getDateKeyFromIso(value);
  if (!dateKey) return "N/A";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value?: string): string {
  const date = parseDate(value);
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  const payable =
    typeof item.payablePrice === "number" ? item.payablePrice : item.price;
  return formatCurrency(payable);
}

function getWhatsappNumber(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function getStatusLabel(status?: BookingItem["status"]): string {
  if (status === "confirmed") return "Confirmed";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

function BookingDetailsSkeleton() {
  return (
    <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 sm:px-5">
      <div className="rounded-[8px] bg-[#F0F3F6] p-4">
        <div className="mb-4 h-8 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[18px] bg-[#F0F3F6] p-4 sm:p-5">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="grid grid-cols-7 gap-x-6 gap-y-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-[8px] bg-white" />
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
    </div>
  );
}

export function BookingDetailsModal({
  open,
  onOpenChange,
  bookingId,
}: BookingDetailsModalProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const { data: booking, isLoading, isError, error } = useQuery<
    BookingItem,
    Error
  >({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error("No booking ID.");

      const baseUrl = getApiBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
        );
      }

      const response = await fetch(`${baseUrl}/booking/${bookingId}`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await response.json().catch(() => null)) as
        | BookingDetailsApiResponse
        | null;
      const hasExplicitFailure = json?.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(json?.message || "Failed to fetch booking details.");
      }

      if (!json?.data) {
        throw new Error("Booking details not found.");
      }

      return json.data;
    },
    enabled: !!bookingId && open,
    staleTime: 1000 * 60 * 2,
  });

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const yearOptions = useMemo(() => {
    const start = selectedYear - 3;
    return Array.from({ length: 10 }, (_, i) => start + i);
  }, [selectedYear]);

  const quote = booking?.quote;
  const surveyDateKey = useMemo(
    () => getDateKeyFromIso(quote?.surveyDate),
    [quote?.surveyDate]
  );
  const installDateKey = useMemo(
    () => getDateKeyFromIso(quote?.installDate),
    [quote?.installDate]
  );

  useEffect(() => {
    if (!open) return;

    const initialDateKey = installDateKey ?? surveyDateKey;
    if (!initialDateKey) {
      const currentDate = new Date();
      setSelectedMonth(currentDate.getMonth());
      setSelectedYear(currentDate.getFullYear());
      return;
    }

    const [year, month] = initialDateKey.split("-").map(Number);
    if (!year || !month) return;

    setSelectedYear(year);
    setSelectedMonth(month - 1);
  }, [open, bookingId, installDateKey, surveyDateKey]);

  const paymentMethod = quote
    ? quote.payByCard
      ? "Pay by card"
      : quote.payMounthly
      ? "Pay monthly"
      : "Not specified"
    : "N/A";
  const whatsappNumber = getWhatsappNumber(quote?.personalInfo?.mobleNumber);

  const handleWhatsappClick = () => {
    if (!whatsappNumber) return;
    window.location.href = `https://wa.me/${whatsappNumber}`;
  };

  if (!bookingId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="max-h-[92vh] !w-[1400px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[14px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-[#EEF2F5] px-5 py-4">
            <DialogTitle className="text-[28px] font-semibold text-[#2D3D4D]">
              Booking Details
            </DialogTitle>
          </div>

          {isLoading ? (
            <BookingDetailsSkeleton />
          ) : isError || !booking ? (
            <div className="flex h-64 items-center justify-center px-4 text-center text-red-600">
              Failed to load booking details
              {error?.message ? `: ${error.message}` : ""}
            </div>
          ) : (
            <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="rounded-[8px] bg-[#F0F3F6] p-4">
                <h3 className="mb-4 text-[28px] font-semibold text-[#2D3D4D]">
                  Personal Details
                </h3>

                <div className="grid grid-cols-1 gap-3 text-[16px] text-[#2D3D4D] sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Name:</span>
                    <span>{getFullName(quote?.personalInfo)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#64748B]" />
                    <span>{quote?.personalInfo?.email || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#64748B]" />
                    <span>{quote?.personalInfo?.mobleNumber || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#64748B]" />
                    <span>
                      {quote?.installAddress ||
                        quote?.personalInfo?.postcode ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] bg-[#F0F3F6] p-4 sm:p-5">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="text-[28px] font-semibold text-[#2D3D4D]">
                    Booking Calendar
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={String(selectedMonth)}
                      onValueChange={(value) => setSelectedMonth(Number(value))}
                    >
                      <SelectTrigger className="h-[40px] w-[190px] rounded-[10px] border border-transparent bg-white px-4 text-[14px] font-semibold text-[#2D3D4D] shadow-none focus-visible:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={String(selectedYear)}
                      onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                      <SelectTrigger className="h-[40px] w-[190px] rounded-[10px] border border-transparent bg-white px-4 text-[14px] font-semibold text-[#2D3D4D] shadow-none focus-visible:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 text-[12px] text-[#4E5D6C]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-[#FBFF26]" />
                    Survey date
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-[#00A56F]" />
                    Install date
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm border-2 border-[#2D3D4D] bg-white" />
                    Selected booking date
                  </span>
                </div>

                <p className="mb-4 text-[13px] text-[#2D3D4D]">
                  Survey: <span className="font-semibold">{formatDate(quote?.surveyDate)}</span>{" "}
                  | Install: <span className="font-semibold">{formatDate(quote?.installDate)}</span>
                </p>

                <div className="grid grid-cols-7 gap-x-6 gap-y-4">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[13px] font-medium text-[#2D3D4D]"
                    >
                      {day}
                    </div>
                  ))}

                  {calendarWeeks.flatMap((week, rowIndex) =>
                    week.map((value, colIndex) => {
                      const key = `${rowIndex}-${colIndex}`;
                      const dateKey =
                        value !== null
                          ? buildDateKey(selectedYear, selectedMonth, value)
                          : null;
                      const hasSurveyBookings =
                        dateKey !== null && surveyDateKey === dateKey;
                      const hasInstallBookings =
                        dateKey !== null && installDateKey === dateKey;
                      const isSelectedSurveyDate =
                        dateKey !== null && surveyDateKey === dateKey;
                      const isSelectedInstallDate =
                        dateKey !== null && installDateKey === dateKey;

                      let dayClass = "bg-white text-[#2D3D4D]";
                      if (hasInstallBookings) {
                        dayClass = "bg-[#00A56F] text-white";
                      } else if (hasSurveyBookings) {
                        dayClass = "bg-[#FBFF26] text-[#2D3D4D]";
                      }

                      const selectedDateClass =
                        isSelectedInstallDate || isSelectedSurveyDate
                          ? "ring-2 ring-[#2D3D4D] ring-offset-1"
                          : "";

                      return (
                        <div key={key} className="flex justify-center">
                          <div
                            className={`flex h-[48px] w-[74px] flex-col items-center justify-center rounded-[8px] text-[14px] font-medium ${dayClass} ${selectedDateClass}`}
                          >
                            {value ?? ""}
                            {value !== null && (hasSurveyBookings || hasInstallBookings) ? (
                              <div className="mt-0.5 flex items-center gap-1">
                                {hasSurveyBookings ? (
                                  <span
                                    className="rounded-[3px] bg-[#fff8dc] px-1 text-[8px] font-semibold text-[#7A6100]"
                                  >
                                    S
                                  </span>
                                ) : null}
                                {hasInstallBookings ? (
                                  <span
                                    className={`rounded-[3px] px-1 text-[8px] font-semibold ${
                                      hasSurveyBookings
                                        ? "bg-[#D6F3E5] text-[#007D53]"
                                        : "bg-white/20 text-white"
                                    }`}
                                  >
                                    I
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="mb-6 text-[28px] font-semibold text-[#2D3D4D]">
                  Quiz Answers
                </h3>

                {(quote?.quizAnswers ?? []).length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(quote?.quizAnswers ?? []).map((item, index) => (
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
                  Option Chosen
                </h3>

                <div className="rounded-[8px] border-b border-[#2D3D4D] bg-white">
                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Product</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote?.productId)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Product Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote?.productId)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Controller</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote?.controller)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Controller Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote?.controller)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Extra</p>
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {getItemTitle(quote?.extra)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Extra Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getItemPrice(quote?.extra)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Survey Date</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDate(quote?.surveyDate)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Install Date</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDate(quote?.installDate)}
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
                    <p className="shrink-0 text-right text-[13px] font-medium text-[#2D3D4D]">
                      {quote?.payMounthlyData
                        ? `Deposit ${formatCurrency(quote.payMounthlyData.deposit)} • ${quote.payMounthlyData.mounthNumber ?? 0} months • ${formatCurrency(quote.payMounthlyData.amount)}/month`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Booking Status</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {getStatusLabel(booking.status)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Booking Price</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatCurrency(booking.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#D9E0E7] px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Booked At</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <p className="text-[16px] text-[#2D3D4D]">Quote Updated At</p>
                    <p className="shrink-0 text-[13px] font-medium text-[#2D3D4D]">
                      {formatDateTime(quote?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Button className="h-[48px] w-full rounded-[4px] bg-[#FFDE59] text-[16px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95">
                  Email quote via email
                </Button>

                <Button
                  className="h-[48px] w-full rounded-[4px] bg-[#00A56F] text-[16px] font-semibold text-white hover:bg-[#009562]"
                  onClick={handleWhatsappClick}
                  disabled={!whatsappNumber}
                >
                  Call Your customer via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
