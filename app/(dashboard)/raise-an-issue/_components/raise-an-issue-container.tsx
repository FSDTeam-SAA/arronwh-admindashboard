"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Trash2, Search, Loader2, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { CustomPagination } from "@/components/ui/common/CustomPagination";
import { IssueDetailsModal } from "./IssueDetailsModal";
import { IssueItem, IssueApiResponse, DeleteIssueApiResponse } from "./raise-an-issue-data-type";

// ==================== HELPERS ====================

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    ""
  );
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

function IssueSkeletonRow() {
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

// ==================== MAIN COMPONENT ====================

export default function RaiseAnIssueContainer() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  // State Management
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [openDetailsModal, setOpenDetailsModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<IssueItem | null>(null);

  // React Query: Fetch Issues List
  const { data, isLoading, isError, error, isFetching } = useQuery<
    IssueApiResponse,
    Error
  >({
    queryKey: ["issues", page, pageSize, token],
    queryFn: async () => {
      const baseUrl = getApiBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "API base URL is not defined. Please verify environmental variables."
        );
      }

      const response = await fetch(
        `${baseUrl}/issue?sortBy=createdAt&limit=${pageSize}&page=${page}`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const json = (await response.json().catch(() => null)) as IssueApiResponse | null;
      if (!json) {
        throw new Error("Failed to parse issues response.");
      }
      const hasExplicitFailure = json.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(json.message || "Failed to fetch issues.");
      }

      return json;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
    placeholderData: (previousData) => previousData,
  });

  // Client-side search filters
  const filteredIssues = useMemo<IssueItem[]>(() => {
    const rawIssues = data?.data ?? [];
    if (!searchQuery.trim()) return rawIssues;

    const query = searchQuery.toLowerCase();
    return rawIssues.filter(
      (issue: IssueItem) =>
        issue.name?.toLowerCase().includes(query) ||
        issue.email?.toLowerCase().includes(query) ||
        issue.phone?.toLowerCase().includes(query) ||
        issue.message?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // React Query: Delete Issue Mutation
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/issue/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const json = (await response.json().catch(() => null)) as DeleteIssueApiResponse | null;
      if (!json) {
        throw new Error("Failed to parse delete response.");
      }
      const hasExplicitFailure = json.success === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(json.message || "Failed to delete issue.");
      }

      return json;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Issue ticket deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setOpenDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete issue ticket."
      );
    },
  });

  // Action Handlers
  const handleOpenDetails = (issue: IssueItem) => {
    setSelectedIssue(issue);
    setOpenDetailsModal(true);
  };

  const handleDeleteOpen = (issue: IssueItem) => {
    setDeleteTarget(issue);
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
    deleteIssueMutation.mutate(deleteTarget._id);
  };

  // Pagination calculations
  const totalItems = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <>
      <div className="min-h-screen bg-[#EEF2F5] px-4 py-5 sm:px-6 lg:px-3">
        <div className="w-full space-y-5">
          {/* Header & Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
                Raise An Issue Management
              </h1>

              <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
                <Link href="/" className="transition hover:text-[#00A56F]">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                <span>Raise An Issue</span>
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-4 space-y-4">
            
            {/* Search Input Filter */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search issues by name, email, phone or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-[8px] border-[#D9E0E7] bg-white pl-10 pr-4 text-[#2D3D4D] placeholder:text-[#94A3B8] focus-visible:border-[#D9E0E7] focus-visible:ring-[#FBFF26]"
              />
            </div>

            {/* Table wrapper for horizontal scrolling */}
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="border-none bg-[#F4F7F9] hover:bg-[#F4F7F9]">
                    <TableHead className="h-[42px] rounded-l-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      User Name
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Email Address
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Phone Number
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F] max-w-[320px]">
                      Message 
                    </TableHead>
                    <TableHead className="h-[42px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Created Date
                    </TableHead>
                    <TableHead className="h-[42px] rounded-r-[8px] px-4 text-[16px] font-medium text-[#00A56F]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, idx) => (
                      <IssueSkeletonRow key={idx} />
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-red-600 font-semibold"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <span>Error loading issues: {error.message}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredIssues.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-[#64748B] font-medium"
                      >
                        No active issues found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIssues.map((issue) => (
                      <TableRow
                        key={issue._id}
                        className="border-b border-[#EDF1F4] hover:bg-transparent"
                      >
                        <TableCell className="px-4 py-[14px] text-[14px] font-semibold text-[#2D3D4D]">
                          {issue.name || "N/A"}
                        </TableCell>

                        <TableCell className="max-w-[220px] px-4 py-[14px] text-[14px] font-medium leading-6 text-[#2D3D4D]">
                          <span className="break-words">{issue.email || "N/A"}</span>
                        </TableCell>

                        <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                          {issue.phone || "N/A"}
                        </TableCell>

                        <TableCell className="max-w-[320px] px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D] truncate">
                          {issue.message || "No description provided."}
                        </TableCell>

                        <TableCell className="px-4 py-[14px] text-[14px] font-medium text-[#2D3D4D]">
                          {formatDate(issue.createdAt)}
                        </TableCell>

                        <TableCell className="px-4 py-[14px]">
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              onClick={() => handleOpenDetails(issue)}
                              className="h-[36px] rounded-full bg-[#00A56F1A] px-3.5 text-[13px] font-semibold text-[#12A150] hover:bg-[#dcf4e7]"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View Details
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOpen(issue)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#F5D64E] transition hover:bg-[#FFF8DB]"
                              title="Delete issue"
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#EDF1F4] pt-4">
              <p className="text-[13px] font-medium text-[#64748B]">
                Showing {startItem} to {endItem} of {totalItems} results
                {isFetching && !isLoading ? " • updating list..." : ""}
              </p>

              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Details Popup */}
      <IssueDetailsModal
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        issue={selectedIssue}
      />

      {/* Delete Confirmation Warning Dialog */}
      <Dialog open={openDeleteModal} onOpenChange={handleDeleteClose}>
        <DialogPortal>
          <DialogOverlay className="bg-[#2D3D4DCC]" />

          <DialogContent className="w-[440px] max-w-[92vw] gap-0 rounded-[16px] border-none bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8E8] text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>

            <DialogTitle className="mt-4 text-[20px] font-bold text-[#2D3D4D]">
              Delete Issue Ticket?
            </DialogTitle>
            <p className="mt-2 text-[14px] text-[#64748B] leading-relaxed">
              Are you sure you want to delete the issue submitted by{" "}
              <strong className="text-[#2D3D4D]">{deleteTarget?.name || "this user"}</strong>?
              This operation is permanent and cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteClose(false)}
                disabled={deleteIssueMutation.isPending}
                className="h-[42px] rounded-[10px] border border-gray-300 bg-transparent px-5 text-[14px] font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteIssueMutation.isPending}
                className="h-[42px] rounded-[10px] bg-red-600 px-5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {deleteIssueMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Yes, Delete"
                )}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}