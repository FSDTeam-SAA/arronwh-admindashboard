import { Skeleton } from "@/components/ui/skeleton";

export function ProductSummarySkeleton() {
  return (
    <div className="h-fit rounded-[4px] bg-[#FFFFFF] p-4 xl:sticky xl:top-5">
      {/* Header */}
      <Skeleton className="mb-4 h-5 w-[75%]" />

      {/* Pay today / Monthly */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4 space-y-2">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-7 w-[55%]" />
          <Skeleton className="h-3 w-[50%]" />
        </div>
        <div className="rounded-[8px] bg-[#F0F3F6] p-3 sm:p-4 space-y-2">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-7 w-[55%]" />
          <Skeleton className="h-3 w-[50%]" />
        </div>
      </div>

      {/* Discount row */}
      <Skeleton className="mt-4 h-[48px] w-full rounded-[8px]" />

      {/* Buttons */}
      <Skeleton className="mt-4 h-[48px] w-full rounded-[6px]" />
      <Skeleton className="mt-3 h-[48px] w-full rounded-[6px]" />

      {/* Quote items */}
      <div className="mt-5 space-y-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-4 border-b border-dotted border-[#A7B1BB] py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-[58%]" />
            <Skeleton className="h-4 w-[22%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
