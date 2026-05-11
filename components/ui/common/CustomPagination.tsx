"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CustomPaginationProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pagination className="w-auto justify-end">
        <PaginationContent className="gap-1">
          {/* Prev Button */}
          <PaginationItem>
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange(currentPage - 1)}
              disabled={!canGoPrev}
              className={cn(
                "flex h-[40px] w-[40px] items-center justify-center rounded-[4px] border transition",
                canGoPrev
                  ? "border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                  : "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </PaginationItem>

          {/* Dynamic Page Numbers */}
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;

            return (
              <PaginationItem key={page}>
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "flex h-[40px] min-w-[40px] items-center justify-center rounded-[4px] border px-2 text-[12px] font-medium transition",
                    currentPage === page
                      ? "border-[#F5D64E] bg-[#FBFF26] text-black"
                      : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                  )}
                >
                  {page}
                </button>
              </PaginationItem>
            );
          })}

          {/* Next Button */}
          <PaginationItem>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className={cn(
                "flex h-[40px] w-[40px] items-center justify-center rounded-[4px] border transition",
                canGoNext
                  ? "border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
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