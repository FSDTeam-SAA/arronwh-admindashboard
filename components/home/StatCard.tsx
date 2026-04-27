import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: {
    percentage: number
    direction: 'up' | 'down'
  }
  subText?: string
  sideTextLines?: string[]
}

export function StatCard({
  title,
  value,
  change,
  subText,
  sideTextLines,
}: StatCardProps) {
  const showSideText = !change && Boolean(sideTextLines?.length)

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h3 className="text-sm text-gray-600 font-medium mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subText && <p className="mt-2 whitespace-pre-line text-xs text-gray-500">{subText}</p>}
        </div>
        {change && (
          <div className={`flex items-center gap-1 ${change.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {change.direction === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="text-sm font-medium">{change.percentage}%</span>
          </div>
        )}
        {showSideText && (
          <div className="space-y-1 text-right text-base font-medium text-gray-600">
            {sideTextLines?.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
