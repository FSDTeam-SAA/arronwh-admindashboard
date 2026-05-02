import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedBundleSkeleton() {
  return (
    <div className="overflow-hidden rounded-[6px] bg-white shadow-sm">
      {/* Green header */}
      <Skeleton className="h-8 w-full rounded-none bg-[#00A56F]/20" />

      <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        {/* Left text */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-[60%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="mt-2 h-9 w-[30%]" />
          <Skeleton className="mt-4 h-[46px] w-full max-w-[440px] rounded-[6px]" />
        </div>

        {/* Right images */}
        <div className="flex items-center justify-center gap-5 sm:gap-6">
          <Skeleton className="h-[90px] w-[90px] sm:h-[110px] sm:w-[110px]" />
          <Skeleton className="h-[90px] w-[90px] sm:h-[110px] sm:w-[110px]" />
        </div>
      </div>
    </div>
  );
}
