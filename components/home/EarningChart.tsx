'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const data = [
  { month: 'Feb', value: 40, date: 'February 2025' },
  { month: 'Mar', value: 45, date: 'March 2025' },
  { month: 'Apr', value: 50, date: 'April 2025' },
  { month: 'May', value: 48, date: 'May 2025' },
  { month: 'Jun', value: 52, date: 'June 2025' },
  { month: 'Jul', value: 55, date: 'July 2025' },
  { month: 'Aug', value: 58, date: 'August 2025' },
  { month: 'Sep', value: 62, date: 'September 2025' },
  { month: 'Oct', value: 68, date: 'October 2025' },
  { month: 'Nov', value: 75, date: 'November 2025' },
  { month: 'Dec', value: 72, date: 'December 2025' },
  { month: 'Jan', value: 80, date: 'January 2026' },
]

const CustomTooltip = (props: any) => {
  const { active, payload } = props
  if (active && payload && payload.length) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-600">{payload[0].payload.date}</span>
        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
      </div>
    )
  }
  return null
}

export function EarningChart() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'bookings'>('revenue')

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Earning Overview</h2>
        <div className="flex items-center gap-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'revenue'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Bookings
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
            <span>Monthly</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#d1d5db"
            style={{ fontSize: '12px', color: '#6b7280' }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#fbbf24"
            strokeWidth={2.5}
            fill="url(#colorValue)"
            dot={false}
            activeDot={{ r: 5, fill: '#fbbf24' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
