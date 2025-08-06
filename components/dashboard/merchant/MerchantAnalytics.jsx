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
          value={revenue?.total || 0}
          format="currency"
          icon={DollarSign}
          color="green"
          subtitle={revenue?.total ? "All time revenue" : "No revenue yet"}
        />
        <MetricCard
          title="Total Bookings"
          value={analytics?.totalBookings || 0}
          format="number"
          icon={Calendar}
          color="blue"
          subtitle={analytics?.totalBookings ? "Total bookings" : "No bookings yet"}
        />
        <MetricCard
          title="Avg Fill Rate"
          value={analytics?.fillRate || 0}
          format="percentage"
          icon={TrendingUp}
          color="purple"
          subtitle={analytics?.fillRate ? "Average fill rate" : "No classes yet"}
        />
        <MetricCard
          title="Customer Growth"
          value={analytics?.customerGrowth || 0}
          format="percentage"
          icon={Users}
          color="orange"
          subtitle={analytics?.customerGrowth ? "Monthly growth" : "No customers yet"}
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