"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function CustomPagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: CustomPaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pagination className="w-auto justify-end">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange(currentPage - 1)}
              disabled={!canGoPrev}
              className={cn(
                "flex h-[40px] w-[40px] items-center justify-center rounded-[4px] border text-[#64748B] transition",
                canGoPrev
                  ? "border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]"
                  : "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </PaginationItem>

          <PaginationItem>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={cn(
                "flex h-[40px] min-w-[40px] items-center justify-center rounded-[4px] border px-2 text-[12px] font-medium transition",
                currentPage === 1
                  ? "border-[#F5D64E] bg-[#FBFF26] text-white"
                  : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
              )}
            >
              1
            </button>
          </PaginationItem>

          {totalPages > 2 && (
            <PaginationItem>
              <div className="flex h-[40px] min-w-[40px] items-center justify-center rounded-[4px] border border-[#CBD5E1] bg-white px-2 text-[#64748B]">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </PaginationItem>
          )}

          {totalPages > 1 && (
            <PaginationItem>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                className="flex h-[40px] min-w-[40px] items-center justify-center rounded-[4px] border border-[#CBD5E1] bg-white px-2 text-[12px] font-medium text-[#475569] hover:bg-[#F8FAFC]"
              >
                {Math.min(totalPages, currentPage === 1 ? 2 : currentPage)}
              </button>
            </PaginationItem>
          )}

          {onPageSizeChange && (
            <PaginationItem>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-[40px] rounded-[4px] border border-[#CBD5E1] bg-white px-2 text-[12px] font-medium text-[#475569] outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </PaginationItem>
          )}

          <PaginationItem>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className={cn(
                "flex h-[40px] w-[40px] items-center justify-center rounded-[4px] border text-[#64748B] transition",
                canGoNext
                  ? "border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]"
                  : "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
