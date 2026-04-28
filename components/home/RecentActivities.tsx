'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { QuoteDetailsModal } from '@/app/(dashboard)/quotes/_components/QuoteDetailsModal'

type PersonalInfo = {
  fastName?: string
  sureName?: string
  email?: string
  mobleNumber?: string
}

type QuoteApiItem = {
  _id: string
  personalInfo?: PersonalInfo
  createdAt?: string
  surveyDate?: string
  installDate?: string
  payByCard?: boolean
  payMounthly?: boolean
}

type QuotesApiData = {
  data: QuoteApiItem[]
}

type QuotesApiResponse = {
  success: boolean
  message: string
  data: QuotesApiData
}

type Activity = {
  id: string
  name: string
  email: string
  phone: string
  action: string
  time: string
  status: 'pending' | 'completed'
}

const RECENT_LIMIT = 5

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || ''
}

function getFullName(personalInfo?: PersonalInfo): string {
  if (!personalInfo) return 'N/A'

  const firstName = personalInfo.fastName?.trim() || ''
  const lastName = personalInfo.sureName?.trim() || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || 'N/A'
}

function formatRelativeTime(value?: string): string {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'Just now'

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Just now'
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`

  return `${Math.floor(diffMs / day)} days ago`
}

async function fetchRecentQuotes(): Promise<QuotesApiResponse> {
  const baseUrl = getApiBaseUrl()

  if (!baseUrl) {
    throw new Error(
      'Missing API base URL. Please set NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL.'
    )
  }

  const response = await fetch(`${baseUrl}/quote?page=1&limit=${RECENT_LIMIT}`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load recent activities: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as QuotesApiResponse
  if (!json.success) {
    throw new Error(json.message || 'Failed to load recent activities.')
  }

  return json
}

function RecentActivitySkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((_, index) => (
        <td key={`recent-activity-skeleton-${index}`} className="py-4 px-0">
          <div className="h-4 w-[90%] animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  )
}

export function RecentActivities() {
  const [openDetails, setOpenDetails] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)

  const recentActivitiesQuery = useQuery<QuotesApiResponse, Error>({
    queryKey: ['recent-activities', RECENT_LIMIT],
    queryFn: fetchRecentQuotes,
    staleTime: 1000 * 60,
  })

  const activities = useMemo<Activity[]>(() => {
    const items = recentActivitiesQuery.data?.data?.data ?? []

    return items.map((item) => {
      const displayDate = item.createdAt || item.surveyDate || item.installDate

      return {
        id: item._id,
        name: getFullName(item.personalInfo),
        email: item.personalInfo?.email?.trim() || 'N/A',
        phone: item.personalInfo?.mobleNumber?.trim() || 'N/A',
        action: 'Quote Generated',
        time: formatRelativeTime(displayDate),
        status: item.payByCard || item.payMounthly ? 'completed' : 'pending',
      }
    })
  }, [recentActivitiesQuery.data])

  const showSkeleton =
    recentActivitiesQuery.isLoading ||
    (recentActivitiesQuery.isFetching && activities.length === 0)

  const handleViewDetails = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
    setOpenDetails(true)
  }

  return (
    <>
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#2D3D4D]">Recent Activities</h2>
          <Link href="/quotes" className="text-sm text-yellow-500 font-medium hover:text-yellow-600">
            See all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Name</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Email</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Phone</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Action</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Time</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0">Status</th>
                <th className="text-left text-base font-semibold text-teal-600 py-3 px-0"></th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                Array.from({ length: RECENT_LIMIT }).map((_, index) => (
                  <RecentActivitySkeletonRow key={`recent-activity-row-${index}`} />
                ))
              ) : recentActivitiesQuery.isError ? (
                <tr>
                  <td colSpan={7} className="text-sm text-red-600 py-6 px-0 text-center">
                    Failed to load recent activities: {recentActivitiesQuery.error.message}
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-sm text-gray-500 py-6 px-0 text-center">
                    No recent activity found.
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="text-sm text-gray-900 py-4 px-0">{activity.name}</td>
                    <td className="text-sm text-gray-600 py-4 px-0">{activity.email}</td>
                    <td className="text-sm text-gray-600 py-4 px-0">{activity.phone}</td>
                    <td className="text-sm text-gray-600 py-4 px-0">{activity.action}</td>
                    <td className="text-sm text-gray-600 py-4 px-0">{activity.time}</td>
                    <td className="text-sm py-4 px-0">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {activity.status === 'pending' ? 'Pending' : 'Completed'}
                      </span>
                    </td>
                    <td className="text-sm py-4 px-0">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(activity.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuoteDetailsModal
        open={openDetails}
        onOpenChange={(nextOpen) => {
          setOpenDetails(nextOpen)
          if (!nextOpen) {
            setSelectedQuoteId(null)
          }
        }}
        quoteId={selectedQuoteId}
      />
    </>
  )
}
