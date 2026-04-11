import { Eye } from 'lucide-react'

interface Activity {
  id: string
  name: string
  email: string
  phone: string
  action: string
  time: string
  status: 'pending' | 'completed'
}

const activitiesData: Activity[] = [
  {
    id: '1',
    name: 'Savannah Nguyen',
    email: 'debra.holt@example.com',
    phone: '(270) 555-0117',
    action: 'Quote Generated',
    time: '2 hours ago',
    status: 'pending',
  },
  {
    id: '2',
    name: 'Robert Fox',
    email: 'deanna.curtis@example.com',
    phone: '(316) 555-0116',
    action: 'Quote Generated',
    time: '4 hours ago',
    status: 'completed',
  },
  {
    id: '3',
    name: 'Jacob Jones',
    email: 'jessica.hanson@example.com',
    phone: '(217) 555-0113',
    action: 'Quote Generated',
    time: '6 hours ago',
    status: 'completed',
  },
]

export function RecentActivities() {
  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
        <a href="#" className="text-sm text-yellow-500 font-medium hover:text-yellow-600">
          See all
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Name</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Email</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Phone</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Action</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Time</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0">Status</th>
              <th className="text-left text-xs font-semibold text-teal-600 py-3 px-0"></th>
            </tr>
          </thead>
          <tbody>
            {activitiesData.map((activity) => (
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
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
