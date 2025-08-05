'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { RevenueChart, BookingsChart, ClassPerformanceChart } from '@/components/dashboard/ChartComponents'
import MetricCard from '@/components/dashboard/MetricCard'
import { DollarSign, Users, TrendingUp, Calendar } from 'lucide-react'

export default function MerchantAnalytics() {
  const { analytics, revenue, loading } = useDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        <p className="text-gray-600">Detailed insights into your studio performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={revenue?.total || 25000}
          format="currency"
          icon={DollarSign}
          color="green"
          trend={12}
          trendDirection="up"
        />
        <MetricCard
          title="Total Bookings"
          value={analytics?.totalBookings || 1234}
          format="number"
          icon={Calendar}
          color="blue"
          trend={8}
          trendDirection="up"
        />
        <MetricCard
          title="Avg Fill Rate"
          value={analytics?.fillRate || 85}
          format="percentage"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Customer Growth"
          value={analytics?.customerGrowth || 15}
          format="percentage"
          icon={Users}
          color="orange"
          trend={5}
          trendDirection="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenue?.chartData || []} loading={loading} />
        <BookingsChart data={analytics?.bookingsData || []} loading={loading} />
      </div>

      <ClassPerformanceChart data={analytics?.classData || []} loading={loading} />
    </div>
  )
}