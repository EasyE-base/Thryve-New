'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import { EarningsChart } from '@/components/dashboard/ChartComponents'
import MetricCard from '@/components/dashboard/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Calendar, CreditCard, Download, Building2 } from 'lucide-react'

export default function InstructorEarnings() {
  const { earnings, loading } = useDashboard()

  const earningsData = earnings || {
    thisWeek: 600,
    thisMonth: 2400,
    total: 18500,
    growth: 8,
    payouts: [
      { date: '2024-01-15', amount: 580, status: 'paid', studio: 'Downtown Studio' },
      { date: '2024-01-08', amount: 520, status: 'paid', studio: 'Westside Fitness' },
      { date: '2024-01-01', amount: 640, status: 'paid', studio: 'Downtown Studio' }
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-gray-600">Track your teaching income</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Earnings Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="This Week"
          value={earningsData.thisWeek}
          format="currency"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="This Month"
          value={earningsData.thisMonth}
          format="currency"
          icon={Calendar}
          color="blue"
          trend={earningsData.growth}
          trendDirection="up"
        />
        <MetricCard
          title="Total Earned"
          value={earningsData.total}
          format="currency"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Next Payout"
          value="Jan 22"
          format="text"
          icon={CreditCard}
          color="orange"
          subtitle="In 3 days"
        />
      </div>

      {/* Earnings Chart */}
      <EarningsChart data={earnings?.chartData || []} loading={loading} />

      {/* Recent Payouts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {earningsData.payouts.map((payout, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">${payout.amount}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <Building2 className="h-3 w-3" />
                      <span>{payout.studio}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">
                    {payout.status}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    {payout.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}