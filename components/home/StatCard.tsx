import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: {
    percentage: number
    direction: 'up' | 'down'
  }
  subText?: string
}

export function StatCard({ title, value, change, subText }: StatCardProps) {
  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h3 className="text-sm text-gray-600 font-medium mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subText && <p className="text-xs text-gray-500 mt-2">{subText}</p>}
        </div>
        {change && (
          <div className={`flex items-center gap-1 ${change.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {change.direction === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="text-sm font-medium">{change.percentage}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
