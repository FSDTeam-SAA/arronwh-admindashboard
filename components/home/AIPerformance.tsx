import { FileText, AlertTriangle } from 'lucide-react'

export function AIPerformance() {
  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white h-[500px]">
      <h2 className="text-lg font-bold text-gray-900 mb-6">AI Performance</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
            <FileText size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">AI Calls Made</p>
            <p className="text-xs text-gray-500">Lorem ipsum</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
            <AlertTriangle size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Failed Payments</p>
            <p className="text-xs text-gray-500">Lorem ipsum</p>
          </div>
        </div>
      </div>
    </div>
  )
}
