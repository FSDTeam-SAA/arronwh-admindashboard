'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type EarningType = 'revenue' | 'booking';

type EarningOverviewApiItem = {
  month: string;
  revenue?: number;
  booking?: number;
  bookings?: number;
  totalBookings?: number;
  count?: number;
  value?: number;
};

type EarningOverviewApiResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: EarningOverviewApiItem[];
};

type ChartPoint = {
  month: string;
  value: number;
};

const MONTH_ORDER = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_LABEL: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May',
  Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October',
  Nov: 'November', Dec: 'December'
};

const chartConfig = {
  value: {
    label: 'Overview',
    color: '#FBFF26',
  },
} satisfies ChartConfig;

const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizeMonthKey = (month: string): string => {
  const normalized = month.trim().slice(0, 3);
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const resolveMetricValue = (item: EarningOverviewApiItem, type: EarningType): number => {
  if (type === 'revenue') {
    return toSafeNumber(item.revenue ?? item.value);
  }
  return toSafeNumber(
    item.booking ?? item.bookings ?? item.totalBookings ?? item.count ?? item.value ?? item.revenue
  );
};

const formatMetricValue = (value: number, type: EarningType): string => {
  if (type === 'revenue') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
};

function ChartSkeleton() {
  return (
    <div className="h-[300px] rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="mb-4 h-4 w-full animate-pulse rounded bg-[#E2E8F0]" />
      <div className="mb-4 h-4 w-4/5 animate-pulse rounded bg-[#E2E8F0]" />
      <div className="mb-4 h-4 w-3/5 animate-pulse rounded bg-[#E2E8F0]" />
      <div className="h-32 w-full animate-pulse rounded bg-[#EEF2F6]" />
      <div className="mt-6 grid grid-cols-12 gap-2">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`earning-skeleton-tick-${index}`}
            className="h-3 animate-pulse rounded bg-[#E2E8F0]"
          />
        ))}
      </div>
    </div>
  );
}

export function EarningChart() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const currentYear = new Date().getFullYear();

  const [activeTab, setActiveTab] = useState<EarningType>('revenue');
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => String(currentYear + index)),
    [currentYear]
  );

  const earningOverviewQuery = useQuery<EarningOverviewApiResponse>({
    queryKey: ['dashboard-earning-overview', token, selectedYear, activeTab],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) {
        throw new Error('Missing access token.');
      }

      const params = new URLSearchParams({
        year: selectedYear,
        type: activeTab,
      });

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
      const response = await fetch(`${apiBase}/dashboard/earning-overview?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? 'Failed to load earning overview.');
      }

      return data as EarningOverviewApiResponse;
    },
  });

  const chartData = useMemo<ChartPoint[]>(() => {
    const rawItems = earningOverviewQuery.data?.data ?? [];
    const monthWiseData = new Map(
      rawItems.map((item) => [normalizeMonthKey(item.month), resolveMetricValue(item, activeTab)])
    );

    return MONTH_ORDER.map((month) => ({
      month,
      value: monthWiseData.get(month) ?? 0,
    }));
  }, [earningOverviewQuery.data, activeTab]);

  const maxValue = useMemo(() => {
    const candidate = Math.max(...chartData.map((point) => point.value), 0);
    if (candidate <= 0) return 10;
    return Math.ceil(candidate * 1.2);
  }, [chartData]);

  const showSkeleton =
    sessionStatus === 'loading' ||
    (Boolean(token) && earningOverviewQuery.isLoading && !earningOverviewQuery.data);

  const hasError = earningOverviewQuery.isError;
  const errorMessage =
    earningOverviewQuery.error instanceof Error
      ? earningOverviewQuery.error.message
      : 'Failed to load earning overview.';

  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#EAEFF4] pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-[#2D3D4D]">Earning Overview</h2>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'revenue'
                  ? 'bg-[#EEF2F6] text-[#2D3D4D]'
                  : 'bg-white text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('booking')}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'booking'
                  ? 'bg-[#EEF2F6] text-[#2D3D4D]'
                  : 'bg-white text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="earning-frequency" className="sr-only">
            Frequency
          </label>
      

          <label htmlFor="earning-year" className="sr-only">
            Year
          </label>
          <select
            id="earning-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="h-[34px] rounded-[7px] border border-[#D7DEE8] bg-white px-2 text-xs font-medium text-[#2D3D4D] outline-none"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSkeleton ? (
        <ChartSkeleton />
      ) : hasError ? (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : (
        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full">
            <AreaChart data={chartData} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="earning-overview-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E8EDF3" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={0}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis hide domain={[0, maxValue]} />
              <ChartTooltip
                cursor={{ stroke: '#D5DEE8' }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label) => `${MONTH_LABEL[String(label)] ?? String(label)} ${selectedYear}`}
                    formatter={(value) => formatMetricValue(toSafeNumber(value), activeTab)}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                fill="url(#earning-overview-gradient)"
                fillOpacity={1}
                stroke="var(--color-value)"
                strokeWidth={3}
                activeDot={{ r: 4, fill: 'var(--color-value)', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
