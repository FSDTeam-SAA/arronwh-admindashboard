'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AIPerformance } from '@/components/home/AIPerformance'
import { EarningChart } from '@/components/home/EarningChart'
import { RecentActivities } from '@/components/home/RecentActivities'
import { StatCard } from '@/components/home/StatCard'

type DashboardSummaryCardApiItem = {
  title: string
  value: number | string
  subtitle?: string
}

type DashboardApiResponse = {
  statusCode: number
  success: boolean
  message: string
  data: {
    summaryCards: DashboardSummaryCardApiItem[]
  }
}

type DashboardStatCard = {
  title: string
  value: string
  change?: {
    percentage: number
    direction: 'up' | 'down'
  }
  subText?: string
  sideTextLines?: string[]
}

const formatCardValue = (title: string, value: number | string): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return String(value ?? '')
  }

  if (title.toLowerCase().includes('revenue')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

const parseSubtitle = (
  subtitle?: string
): Pick<DashboardStatCard, 'change' | 'subText' | 'sideTextLines'> => {
  const normalized = subtitle?.trim()
  if (!normalized) return {}

  const percentageMatch = normalized.match(/([+-]?\d+(?:\.\d+)?)\s*%/)
  const hasTrendSymbol =
    normalized.includes('↑') ||
    normalized.includes('↓') ||
    normalized.includes('+') ||
    normalized.startsWith('-')

  if (percentageMatch && hasTrendSymbol) {
    const rawPercentage = Number(percentageMatch[1])
    if (Number.isFinite(rawPercentage)) {
      return {
        change: {
          percentage: Math.abs(rawPercentage),
          direction:
            normalized.includes('↓') || rawPercentage < 0 ? 'down' : 'up',
        },
      }
    }
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    return { sideTextLines: lines }
  }

  return { subText: normalized }
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6">
      <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />

      <div className="flex items-end justify-between gap-4">
        <div className="w-full">
          <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default function DashboardOverviewClient() {
  const { data: session, status: sessionStatus } = useSession()
  const token = session?.accessToken

  const dashboardQuery = useQuery<DashboardApiResponse>({
    queryKey: ['dashboard-overview', token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) {
        throw new Error('Missing access token.')
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
      const response = await fetch(`${apiBase}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => null)
      const hasExplicitFailure = data?.success === false || data?.status === false

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? 'Failed to load dashboard overview.')
      }

      return data as DashboardApiResponse
    },
  })

  const summaryCards = useMemo<DashboardStatCard[]>(() => {
    return (
      dashboardQuery.data?.data?.summaryCards?.map((card) => ({
        title: card.title,
        value: formatCardValue(card.title, card.value),
        ...parseSubtitle(card.subtitle),
      })) ?? []
    )
  }, [dashboardQuery.data])

  const aiPerformanceMetrics = useMemo(() => {
    const summaryCardsRaw = dashboardQuery.data?.data?.summaryCards ?? []

    const quoteCard = summaryCardsRaw.find((card) =>
      card.title.toLowerCase().includes('quote')
    )
    const failedPaymentCard = summaryCardsRaw.find((card) =>
      card.title.toLowerCase().includes('failed')
    )

    const toNumber = (value: number | string | undefined): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''))
        if (Number.isFinite(parsed)) return parsed
      }
      return 0
    }

    return {
      aiCallsMade: toNumber(quoteCard?.value),
      failedPayments: toNumber(failedPaymentCard?.value),
    }
  }, [dashboardQuery.data])

  const showSummaryCardsSkeleton =
    sessionStatus === 'loading' ||
    (Boolean(token) && dashboardQuery.isLoading && summaryCards.length === 0)

  const showSummaryCardsError = dashboardQuery.isError
  const summaryCardsErrorMessage =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : 'Failed to load dashboard summary cards.'

  return (
    <main className="min-h-screen ">
      <div className="mx-auto w-full">
        <div className="mb-5">
          <h1 className="text-[20px] font-bold leading-none text-[#2D3D4D] sm:text-[32px]">
            Dashboard Overview
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#2D3D4D]">
            <Link href="/" className="transition hover:text-[#00A56F]">
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Dashboard Overview</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {showSummaryCardsSkeleton
            ? Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={`summary-card-skeleton-${index}`} />
              ))
            : summaryCards.map((card, index) => (
                <StatCard
                  key={`${card.title}-${index}`}
                  title={card.title}
                  value={card.value}
                  change={card.change}
                  subText={card.subText}
                  sideTextLines={card.sideTextLines}
                />
              ))}
        </div>

        {showSummaryCardsError ? (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {summaryCardsErrorMessage}
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningChart />
          </div>
          <div>
            <AIPerformance
              aiCallsMade={aiPerformanceMetrics.aiCallsMade}
              failedPayments={aiPerformanceMetrics.failedPayments}
              isLoading={showSummaryCardsSkeleton}
            />
          </div>
        </div>

        <div>
          <RecentActivities />
        </div>
      </div>
    </main>
  )
}
