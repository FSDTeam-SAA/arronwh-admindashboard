import { AIPerformance } from "@/components/home/AIPerformance"
import { EarningChart } from "@/components/home/EarningChart"
import { RecentActivities } from "@/components/home/RecentActivities"
import { StatCard } from "@/components/home/StatCard"

export const metadata = {
  title: 'Dashboard Overview',
  description: 'Dashboard overview with statistics, charts, and recent activities',
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen ">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>Dashboard</span>
            <span>›</span>
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Quotes Generated"
            value="840"
            change={{ percentage: 5, direction: 'down' }}
          />
          <StatCard
            title="Revenue"
            value="$280,500"
            change={{ percentage: 10, direction: 'up' }}
          />
          <StatCard
            title="Total Bookings"
            value="425"
          />
          <StatCard
            title="Bookings"
            value="425"
            subText="Today 789\nYesterday"
          />
        </div>

        {/* Charts and AI Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <EarningChart />
          </div>
          <div>
            <AIPerformance />
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <RecentActivities />
        </div>
      </div>
    </main>
  )
}
