"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many page buttons to show around the active page. Default: 1 */
  siblingCount?: number;
}

/** Build the array of page numbers + ellipsis markers to display */
function buildPageRange(current: number, total: number, siblings: number): (number | "...")[] {
  const delta = siblings + 2; // pages shown on each side of current

  if (total <= delta * 2 + 3) {
    // Small enough: show every page
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const pages: (number | "...")[] = [1];

  if (showLeftDots) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (showRightDots) pages.push("...");
  pages.push(total);

  return pages;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: CustomPaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const pages = buildPageRange(currentPage, totalPages, siblingCount);

  const btnBase =
    "flex h-[36px] min-w-[36px] items-center justify-center rounded-[6px] border text-[13px] font-medium transition-all duration-150 px-2 select-none";

  const navBtn = (enabled: boolean) =>
    cn(
      btnBase,
      enabled
        ? "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#00A56F] hover:bg-[#EDF7F3] hover:text-[#00A56F] cursor-pointer"
        : "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] pointer-events-none"
    );

  const pageBtn = (isActive: boolean) =>
    cn(
      btnBase,
      isActive
        ? "border-[#F5D64E] bg-[#FBFF26] text-[#1E293B] shadow-sm font-semibold cursor-default"
        : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#00A56F] hover:bg-[#EDF7F3] hover:text-[#00A56F] cursor-pointer"
    );

  return (
    <div className="flex items-center gap-1">
      {/* First page */}
      <button
        type="button"
        title="First page"
        onClick={() => onPageChange(1)}
        disabled={!canGoPrev}
        className={navBtn(canGoPrev)}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Prev */}
      <button
        type="button"
        title="Previous page"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={navBtn(canGoPrev)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {pages.map((entry, idx) =>
        entry === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-[36px] w-[36px] items-center justify-center text-[13px] text-[#94A3B8] select-none"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            className={pageBtn(currentPage === entry)}
          >
            {entry}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        title="Next page"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={navBtn(canGoNext)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Last page */}
      <button
        type="button"
        title="Last page"
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoNext}
        className={navBtn(canGoNext)}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}