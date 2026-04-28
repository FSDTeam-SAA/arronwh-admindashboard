import { AlertTriangle, FileText } from 'lucide-react'

type AIPerformanceProps = {
  aiCallsMade?: number
  failedPayments?: number
  isLoading?: boolean
}

const formatCount = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)

function AIPerformanceSkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#E2E8F0]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
      </div>
      <div className="h-4 w-8 animate-pulse rounded bg-[#E2E8F0]" />
    </div>
  )
}

export function AIPerformance({
  aiCallsMade = 0,
  failedPayments = 0,
  isLoading = false,
}: AIPerformanceProps) {
  return (
    <div className="min-h-[370px] rounded-[14px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <h2 className="text-[28px] font-bold leading-tight text-[#2D3D4D]">AI Performance</h2>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <>
            <AIPerformanceSkeletonRow />
            <AIPerformanceSkeletonRow />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] px-3 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#475569]">
                  <FileText size={16} />
                </div>
                <p className="text-sm font-medium text-[#334155]">AI Calls Made</p>
              </div>
              <span className="text-sm font-semibold text-[#F4BF24]">
                {formatCount(aiCallsMade)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[8px] bg-[#F8FAFC] px-3 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#475569]">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-sm font-medium text-[#334155]">Failed Payment</p>
              </div>
              <span className="text-sm font-semibold text-[#F4BF24]">
                {formatCount(failedPayments)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
