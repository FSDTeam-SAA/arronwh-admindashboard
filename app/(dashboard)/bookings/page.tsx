"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Eye, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CustomPagination } from "@/components/ui/common/CustomPagination";
import { BookingDetailsModal } from "./_components/BookingDetailsModal";
import { toast } from "sonner";

// ==================== TYPES ====================

type PersonalInfo = {
  title?: string;
  fastName?: string;
  sureName?: string;
  email?: string;
  mobleNumber?: string;
};

type QuizAnswer = {
  question: string;
  answer: string;
};

type Quote = {
  _id?: string;
  personalInfo?: PersonalInfo;
  quizAnswers?: QuizAnswer[];
  surveyDate?: string;
  installDate?: string;
  installAddress?: string;
  createdAt?: string;
  updatedAt?: string;
};

type BookingStatusApi = "pending" | "confirmed" | "cancelled";
type BookingStatusUi = "Pending" | "Confirmation" | "Cancellation";
type BookingForUi = "Survey" | "Installation";
type BookingForApi = "survey" | "installation";

type BookingItem = {
  _id: string;
  quote?: Quote;
  price?: number;
  status: BookingStatusApi;
  bookingFor?: BookingForApi | string;
  createdAt: string;
  updatedAt?: string;
};

type ApiMeta = {
  total: number;
  page: number;
  limit: number;
};

type ApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: BookingItem[];
};

type DeleteBookingResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type UpdateBookingForResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

// ==================== COMPONENTS ====================

function BookingSkeletonRow() {
  return (
    <TableRow className="border-b border-[#EDF1F4]">
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i} className="px-4 py-[14px]">
          <div className="h-6 w-full animate-pulse rounded-md bg-gray-200" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function BookingForBadge({
  value,
  onChange,
  disabled,
}: {
  value: BookingForUi;
  onChange: (value: BookingForUi) => void;
  disabled?: boolean;
}) {
  const isSurvey = value === "Survey";

  const styles = isSurvey
    ? "bg-[#FBFF26] text-black"
    : "bg-[#00A56F] text-white";

  return (
    <div className="relative w-[190px]">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as BookingForUi)}
        className={cn(
          "h-[35px] w-full appearance-none rounded-full px-4 pr-10 text-[16px] font-medium outline-none",
          styles,
          disabled ? "cursor-not-allowed opacity-70" : ""
        )}
      >
        <option value="Installation">Installation</option>
        <option value="Survey">Survey</option>
      </select>

      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2",
          isSurvey ? "text-black" : "text-white"
        )}
      />
    </div>
  );
}

function StatusBadge({
  value,
}: {
  value: BookingStatusUi;
}) {
  const styles =
    value === "Pending"
      ? "bg-[#FFF5D6] text-[#F5C242]"
      : value === "Confirmation"
      ? "bg-[#E4F7EF] text-[#00A56F]"
      : "bg-[#FDE8E8] text-[#F87171]";

  return (
    <div
      className={cn(
        "inline-flex h-[35px] min-w-[190px] items-center justify-center rounded-full px-4 text-[16px] font-medium",
        styles
      )}
    >
      {value}
    </div>
  );
}

// ==================== HELPERS ====================

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    ""
  );
}

function getFullName(personalInfo?: PersonalInfo): string {
  if (!personalInfo) return "N/A";

  const firstName = personalInfo.fastName?.trim() || "";
  const lastName = personalInfo.sureName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "N/A";
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatPrice(price?: number): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "£0";
  }

  return `£${price.toLocaleString()}`;
}

function getBookingFor(bookingFor?: string, quote?: Quote): BookingForUi {
  if (bookingFor === "installation") return "Installation";
  if (bookingFor === "survey") return "Survey";
  if (!quote) return "Survey";
  return quote.surveyDate ? "Survey" : "Installation";
}

function getBookingForApiValue(value: BookingForUi): BookingForApi {
  return value === "Survey" ? "survey" : "installation";
}

function getStatusForBadge(status: BookingStatusApi): BookingStatusUi {
  if (status === "confirmed") return "Confirmation";
  if (status === "cancelled") return "Cancellation";
  return "Pending";
}

async function fetchBookings(page: number, pageSize: number): Promise<ApiResponse> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
    );
  }

  const res = await fetch(`${baseUrl}/booking?page=${page}&limit=${pageSize}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ApiResponse;

  if (!json.success) {
    throw new Error(json.message || "Failed to fetch bookings");
  }

  return json;
}

// ==================== MAIN COMPONENT ====================

export default function BookingManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<BookingItem | null>(null);
  const [updatingBookingForId, setUpdatingBookingForId] = useState<string | null>(null);
  const [bookingForOverrides, setBookingForOverrides] = useState<
    Record<string, BookingForUi>
  >({});

  const { data, isLoading, isError, error, isFetching } = useQuery<
    ApiResponse,
    Error
  >({
    queryKey: ["bookings", page, pageSize],
    queryFn: () => fetchBookings(page, pageSize),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });

  const bookings: BookingItem[] = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const totalItems = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const handleOpenDetails = (item: BookingItem) => {
    setSelectedBookingId(item._id);
    setOpenDetails(true);
  };

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = getApiBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
        );
      }

      const res = await fetch(`${baseUrl}/booking/${id}`, {
        method: "DELETE",
      });

      const json = (await res.json().catch(() => null)) as DeleteBookingResponse | null;
      const hasExplicitFailure = json?.success === false || json?.status === false;

      if (!res.ok || hasExplicitFailure) {
        throw new Error(json?.message || "Failed to delete booking.");
      }

      return json;
    },
    onSuccess: () => {
      toast.success("Booking deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete booking."
      );
    },
  });

  const updateBookingForMutation = useMutation({
    mutationFn: async ({
      id,
      bookingFor,
    }: {
      id: string;
      bookingFor: BookingForApi;
    }) => {
      const baseUrl = getApiBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
        );
      }

      const res = await fetch(`${baseUrl}/booking/booking-for/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingFor }),
      });

      const json = (await res.json().catch(() => null)) as
        | UpdateBookingForResponse
        | null;
      const hasExplicitFailure = json?.success === false || json?.status === false;

      if (!res.ok || hasExplicitFailure) {
        throw new Error(json?.message || "Failed to update booking for.");
      }

      return json;
    },
    onSuccess: async (_, variables) => {
      toast.success("Booking for updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setBookingForOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error, variables) => {
      setBookingForOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });

      toast.error(
        error instanceof Error ? error.message : "Failed to update booking for."
      );
    },
    onSettled: () => {
      setUpdatingBookingForId(null);
    },
  });

  const handleDeleteOpen = (item: BookingItem) => {
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
    deleteBookingMutation.mutate(deleteTarget._id);
  };

  const handleBookingForChange = (item: BookingItem, nextValue: BookingForUi) => {
    const currentValue =
      bookingForOverrides[item._id] ?? getBookingFor(item.bookingFor, item.quote);

    if (currentValue === nextValue || updateBookingForMutation.isPending) return;

    setBookingForOverrides((prev) => ({ ...prev, [item._id]: nextValue }));
    setUpdatingBookingForId(item._id);
    updateBookingForMutation.mutate({
      id: item._id,
      bookingFor: getBookingForApiValue(nextValue),
    });
  };

  const deleteTargetName = deleteTarget
    ? getFullName(deleteTarget.quote?.personalInfo)
    : "";
  const deleteLabel = deleteTargetName && deleteTargetName !== "N/A"
    ? deleteTargetName
    : "this booking";

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5">
            <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Booking Management
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Booking Management</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="overflow-x-auto">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow className="border-none bg-[#F4F7F9] hover:bg-[#F4F7F9]">
                    <TableHead className="h-[42px] rounded-l-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Name
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Email
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Phone
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Date
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Price
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Booking for
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                     Job Status
                    </TableHead>
                    <TableHead className="h-[42px] rounded-r-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <BookingSkeletonRow key={i} />
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-32 text-center text-red-600"
                      >
                        Failed to load bookings: {error.message}
                      </TableCell>
                    </TableRow>
                  ) : bookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-32 text-center text-[#64748B]"
                      >
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((item) => {
                      const personalInfo = item.quote?.personalInfo;
                      const name = getFullName(personalInfo);
                      const email = personalInfo?.email?.trim() || "N/A";
                      const phone = personalInfo?.mobleNumber?.trim() || "N/A";
                      const date =
                        item.quote?.surveyDate ||
                        item.quote?.installDate ||
                        item.createdAt;

                      return (
                        <TableRow
                          key={item._id}
                          className="border-b border-[#EDF1F4] hover:bg-transparent"
                        >
                          <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                            {name}
                          </TableCell>

                          <TableCell className="max-w-[190px] px-4 py-[14px] text-[14px] font-medium leading-6 text-[#2D3D4D]">
                            <span className="break-words">{email}</span>
                          </TableCell>

                          <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                            {phone}
                          </TableCell>

                          <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                            {formatDate(date)}
                          </TableCell>

                          <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                            {formatPrice(item.price)}
                          </TableCell>

                          <TableCell className="px-4 py-[14px]">
                            <BookingForBadge
                              value={
                                bookingForOverrides[item._id] ??
                                getBookingFor(item.bookingFor, item.quote)
                              }
                              onChange={(value) => handleBookingForChange(item, value)}
                              disabled={
                                updateBookingForMutation.isPending &&
                                updatingBookingForId === item._id
                              }
                            />
                          </TableCell>

                          <TableCell className="px-4 py-[14px]">
                            <StatusBadge value={getStatusForBadge(item.status)} />
                          </TableCell>

                          <TableCell className="px-4 py-[14px]">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                onClick={() => handleOpenDetails(item)}
                                className="h-[40px] rounded-full bg-[#00A56F1A] px-3 text-[14px] font-semibold text-[#12A150] hover:bg-[#dcf4e7]"
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View Details
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleDeleteOpen(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                              >
                                <Trash2 className="h-5 w-5 text-[#FFDE59]" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-medium text-[#64748B]">
                Showing {startItem} to {endItem} of {totalItems} results
                {isFetching && !isLoading ? " • updating..." : ""}
              </p>

              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(size) => {
                  setPageSize(size);
                  setPage(10);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <BookingDetailsModal
        open={openDetails}
        onOpenChange={setOpenDetails}
        bookingId={selectedBookingId}
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
                disabled={deleteBookingMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteBookingMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#FBFF26] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95"
              >
                {deleteBookingMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
