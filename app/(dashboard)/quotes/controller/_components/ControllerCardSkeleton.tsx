import { Skeleton } from "@/components/ui/skeleton";

export function ControllerCardSkeleton() {
  return (
    <div className="rounded-[6px] bg-white p-4 shadow-sm sm:p-5">
      {/* Image area */}
      <div className="relative flex min-h-[220px] items-center justify-center rounded-[8px] bg-[#FBFCFD]">
        <Skeleton className="h-[180px] w-[160px] sm:h-[210px]" />
      </div>

      {/* Content */}
      <div className="mt-5 space-y-3">
        <Skeleton className="h-7 w-[80%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="mt-4 h-8 w-[40%]" />
        <Skeleton className="mt-6 h-[46px] w-full rounded-[6px]" />
      </div>
    </div>
  );
}
