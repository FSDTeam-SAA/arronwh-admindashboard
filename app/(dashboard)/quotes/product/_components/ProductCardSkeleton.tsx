import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[6px] border border-[#00A56F] bg-white shadow-sm">
      <Skeleton className="h-8 w-full rounded-none bg-[#00A56F]/20" />

      <div className="p-3 sm:p-4 lg:p-5">
        {/* Title + tags row */}
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Skeleton className="h-8 w-full max-w-[520px]" />

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-[38px] w-[100px] rounded-full" />
            <Skeleton className="h-[38px] w-[120px] rounded-full" />
            <Skeleton className="h-[38px] w-[130px] rounded-full" />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_34px_minmax(0,1fr)_340px]">
          {/* Image area */}
          <div className="flex flex-col items-center">
            <div className="relative flex min-h-[280px] w-full items-center justify-center rounded-[8px] bg-white">
              <Skeleton className="h-[250px] w-[170px] rounded-[20px]" />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-[10px] w-[10px] rounded-full" />
              <Skeleton className="h-[10px] w-[10px] rounded-full" />
              <Skeleton className="h-[10px] w-[10px] rounded-full" />
            </div>
          </div>

          {/* Arrow placeholder */}
          <div className="hidden xl:flex items-center justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* Middle content */}
          <div className="space-y-4">
            <div className="rounded-[8px] border-[2px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <Skeleton className="h-7 w-full max-w-[420px]" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
              </div>
            </div>

            <div className="rounded-[8px] border-[2px] border-[#94A3B8] bg-white p-4 sm:p-5">
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-[95%]" />
              </div>
            </div>
          </div>

          {/* Pricing box */}
          <div className="rounded-[4px] bg-[#F0F3F6] p-4 sm:p-5">
            <Skeleton className="mb-4 h-6 w-full" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="mt-3 h-8 w-[75%]" />
                <Skeleton className="mt-3 h-3 w-[60%]" />
              </div>

              <div className="rounded-[8px] bg-white p-3 sm:p-4">
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="mt-3 h-8 w-[75%]" />
                <Skeleton className="mt-3 h-3 w-[60%]" />
              </div>
            </div>

            <Skeleton className="mt-4 h-[48px] w-full rounded-[8px]" />
            <Skeleton className="mt-4 h-[46px] w-full rounded-[6px]" />
            <Skeleton className="mt-3 h-[46px] w-full rounded-[6px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
