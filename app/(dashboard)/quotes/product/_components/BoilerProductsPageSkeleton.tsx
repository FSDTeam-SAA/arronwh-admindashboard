"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export default function BoilerProductsPageSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div>
      <div className="h-[6px] w-full bg-[#E5EAF1]">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: "50%" }}
        />
      </div>
      <div className="bg-[#EEF2F5] px-3 py-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-4 flex justify-end">
            <div className="flex overflow-hidden rounded-full border border-[#D9E0E7] bg-white shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2">
                <Skeleton className="h-4 w-[220px]" />
              </div>
              <div className="border-l border-[#E5E7EB] px-4 py-2">
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {Array.from({ length: count }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
