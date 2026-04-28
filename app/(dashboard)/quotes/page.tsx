"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Eye, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomPagination } from "@/components/ui/common/CustomPagination";
import { QuoteDetailsModal } from "./_components/QuoteDetailsModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PersonalInfo = {
  title?: string;
  fastName?: string;
  sureName?: string;
  email?: string;
  mobleNumber?: string;
};

type QuoteSelectableItem = {
  _id: string;
  title?: string;
  price?: number;
  discount?: number;
};

type PayMonthlyData = {
  deposit?: number;
  mounthNumber?: number;
  amount?: number;
  _id?: string;
};

type QuoteApiItem = {
  _id: string;
  status?: string;
  productId?: QuoteSelectableItem | string | null;
  quizAnswers?: Array<{
    question: string;
    answer: string;
  }>;
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

type QuotesApiData = {
  data: QuoteApiItem[];
  total: number;
  page: number;
  limit: number;
};

type QuotesApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: QuotesApiData;
};

type DeleteQuoteApiResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type UpdateQuoteStatusApiResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
};

type QuoteStatus = "pending" | "rejected" | "accepted";

type QuoteItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  status: QuoteStatus;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function QuoteSkeletonRow() {
  return (
    <TableRow className="border-b border-[#EDF1F4]">
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i} className="px-4 py-[14px]">
          <div className="h-6 w-full animate-pulse rounded-md bg-gray-200" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function getQuoteStatus(value?: string): QuoteStatus {
  if (value === "accepted") return "accepted";
  if (value === "rejected") return "rejected";
  return "pending";
}

function QuoteStatusBadge({
  value,
  onChange,
  disabled,
}: {
  value: QuoteStatus;
  onChange: (value: QuoteStatus) => void;
  disabled?: boolean;
}) {
  const styles =
    value === "accepted"
      ? "bg-[#E4F7EF] text-[#00A56F]"
      : value === "rejected"
      ? "bg-[#FDE8E8] text-[#FF0000]"
      : "bg-[#FFF5D6] text-[#000000]";

  return (
    <div className="relative w-[165px]">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as QuoteStatus)}
        className={cn(
          "h-[35px] w-full appearance-none rounded-full px-4 pr-10 text-[15px] font-medium capitalize outline-none transition",
          styles,
          disabled ? "cursor-not-allowed opacity-70" : ""
        )}
      >
        <option value="pending">pending</option>
        <option value="accepted">accepted</option>
        <option value="rejected">rejected</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-current" />
    </div>
  );
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

async function fetchQuotes(
  page: number,
  pageSize: number
): Promise<QuotesApiResponse> {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
    );
  }

  const response = await fetch(`${baseUrl}/quote?page=${page}&limit=${pageSize}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch quotes: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as QuotesApiResponse;

  if (!json.success) {
    throw new Error(json.message || "Failed to fetch quotes");
  }

  return json;
}

export default function QuoteGeneratedPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuoteItem | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, QuoteStatus>
  >({});

  const { data, isLoading, isError, error, isFetching } = useQuery<
    QuotesApiResponse,
    Error
  >({
    queryKey: ["quotes", page, pageSize],
    queryFn: () => fetchQuotes(page, pageSize),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });

  const quotes = useMemo<QuoteItem[]>(() => {
    const rawItems = Array.isArray(data?.data?.data) ? data.data.data : [];

    return rawItems.map((item) => {
      const displayDate = item.createdAt || item.surveyDate || item.installDate;

      return {
        id: item._id,
        name: getFullName(item.personalInfo),
        email: item.personalInfo?.email?.trim() || "N/A",
        phone: item.personalInfo?.mobleNumber?.trim() || "N/A",
        date: formatDate(displayDate),
        status: getQuoteStatus(item.status),
      };
    });
  }, [data]);

  const totalItems = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const handleOpenDetails = (item: QuoteItem) => {
    setSelectedQuoteId(item.id);
    setOpenDetails(true);
  };

  const handleDetailsOpenChange = (nextOpen: boolean) => {
    setOpenDetails(nextOpen);
    if (!nextOpen) {
      setSelectedQuoteId(null);
    }
  };

  const handleOpenDelete = (item: QuoteItem) => {
    setDeleteTarget(item);
    setOpenDelete(true);
  };

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    setOpenDelete(nextOpen);
    if (!nextOpen) {
      setDeleteTarget(null);
    }
  };

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = getApiBaseUrl();

      if (!baseUrl) {
        throw new Error(
          "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
        );
      }

      const response = await fetch(`${baseUrl}/quote/${id}`, {
        method: "DELETE",
      });

      const json = (await response.json().catch(() => null)) as
        | DeleteQuoteApiResponse
        | null;
      const hasExplicitFailure =
        json?.success === false || json?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(json?.message || "Failed to delete quote.");
      }

      return json;
    },
    onSuccess: () => {
      toast.success("Quote deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setOpenDelete(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete quote."
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: QuoteStatus;
    }) => {
      const baseUrl = getApiBaseUrl();

      if (!baseUrl) {
        throw new Error(
          "Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL."
        );
      }

      const response = await fetch(`${baseUrl}/quote/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = (await response.json().catch(() => null)) as
        | UpdateQuoteStatusApiResponse
        | null;
      const hasExplicitFailure =
        json?.success === false || json?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(json?.message || "Failed to update quote status.");
      }

      return json;
    },
    onSuccess: async (_, variables) => {
      toast.success("Quote status updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error, variables) => {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to update status."
      );
    },
    onSettled: () => {
      setUpdatingStatusId(null);
    },
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteQuoteMutation.mutate(deleteTarget.id);
  };

  const handleStatusChange = (item: QuoteItem, nextStatus: QuoteStatus) => {
    const currentStatus = statusOverrides[item.id] ?? item.status;
    if (currentStatus === nextStatus || updateStatusMutation.isPending) return;

    setStatusOverrides((prev) => ({ ...prev, [item.id]: nextStatus }));
    setUpdatingStatusId(item.id);
    updateStatusMutation.mutate({
      id: item.id,
      status: nextStatus,
    });
  };

  const deleteLabel =
    deleteTarget?.name && deleteTarget.name !== "N/A"
      ? deleteTarget.name
      : "this quote";

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full">
          <div className="mb-5">
            <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
              Quote Generated
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
              <Link href="/" className="transition hover:text-[#00A56F]">
                Dashboard
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Quote Generated</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
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
                      Status
                    </TableHead>
                    <TableHead className="h-[42px] rounded-r-[8px] px-4 text-right text-[16px] font-medium text-[#00A56F]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <QuoteSkeletonRow key={i} />
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-red-600"
                      >
                        Failed to load quotes: {error.message}
                      </TableCell>
                    </TableRow>
                  ) : quotes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-[#64748B]"
                      >
                        No quotes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotes.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-b border-[#EDF1F4] hover:bg-transparent"
                      >
                        <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                          {item.name}
                        </TableCell>

                        <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                          {item.email}
                        </TableCell>

                        <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                          {item.phone}
                        </TableCell>

                        <TableCell className="px-4 py-[14px] text-[16px] font-medium text-[#2D3D4D]">
                          {item.date}
                        </TableCell>

                        <TableCell className="px-4 py-[14px]">
                          <QuoteStatusBadge
                            value={statusOverrides[item.id] ?? item.status}
                            onChange={(value) => handleStatusChange(item, value)}
                            disabled={
                              updateStatusMutation.isPending &&
                              updatingStatusId === item.id
                            }
                          />
                        </TableCell>

                        <TableCell className="px-4 py-[14px]">
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              type="button"
                              onClick={() => handleOpenDetails(item)}
                              className="h-[40px] rounded-full bg-[#00A56F1A] px-3 text-[16px] font-semibold text-[#12A150] hover:bg-[#dcf4e7]"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View Details
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                            >
                              <Trash2 className="!h-5 !w-5 text-[#FFDE59]" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <QuoteDetailsModal
        open={openDetails}
        onOpenChange={handleDetailsOpenChange}
        quoteId={selectedQuoteId}
      />

      <Dialog open={openDelete} onOpenChange={handleDeleteOpenChange}>
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
                onClick={() => handleDeleteOpenChange(false)}
                disabled={deleteQuoteMutation.isPending}
                className="h-[40px] rounded-[10px] border border-[#F5D64E] bg-transparent px-6 text-[14px] font-semibold text-[#F5D64E] hover:bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteQuoteMutation.isPending}
                className="h-[40px] rounded-[10px] bg-[#F5D64E] px-6 text-[14px] font-semibold text-[#2D3D4D] hover:bg-[#edcf47]"
              >
                {deleteQuoteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
