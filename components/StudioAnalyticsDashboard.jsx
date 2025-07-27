'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, DollarSign, Users, Calendar, BarChart3, PieChart,
  Activity, Star, Clock, MapPin, CreditCard, Target, Zap, ArrowUpRight
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Cell, AreaChart, Area
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StudioAnalyticsDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [user, dateRange])

  const fetchAnalytics = async () => {
    if (!user) return

    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/server-api/analytics/studio?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">No Analytics Available</h3>
        <p className="text-blue-200">Analytics data will appear once you have classes and bookings.</p>
      </div>
    )
  }

  const revenueData = [
    { name: 'Total Revenue', value: analytics.revenue.total, color: '#0088FE' },
    { name: 'Platform Fees', value: analytics.revenue.platformFees, color: '#FF8042' },
    { name: 'Your Earnings', value: analytics.revenue.studioEarnings, color: '#00C49F' }
  ]

  const xpassData = analytics.xpass.redemptions > 0 ? [
    { name: 'X Pass Revenue', value: analytics.revenue.xpassRevenue },
    { name: 'X Pass Fees', value: analytics.revenue.xpassFees }
  ] : []

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Analytics Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-white">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button 
              onClick={fetchAnalytics}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              Update Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border border-green-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 font-medium text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(analytics.revenue.total)}</p>
                <p className="text-green-300 text-sm">
                  Your earnings: {formatCurrency(analytics.revenue.studioEarnings)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-700/20 border border-blue-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 font-medium text-sm">Classes Taught</p>
                <p className="text-3xl font-bold text-white">{analytics.classes.totalClasses}</p>
                <p className="text-blue-300 text-sm">
                  {analytics.classes.totalBookings} total bookings
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-700/20 border border-purple-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 font-medium text-sm">Utilization Rate</p>
                <p className="text-3xl font-bold text-white">{formatPercentage(analytics.classes.averageUtilization)}</p>
                <p className="text-purple-300 text-sm">
                  Average class capacity
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-700/20 border border-yellow-400/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 font-medium text-sm">X Pass Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(analytics.revenue.xpassRevenue)}</p>
                <p className="text-yellow-300 text-sm">
                  {analytics.xpass.redemptions} redemptions
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription className="text-blue-200">
              Your earnings vs platform fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-green-200">Your Earnings</span>
                </div>
                <span className="text-white font-semibold">{formatCurrency(analytics.revenue.studioEarnings)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-400/20">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-red-200">Platform Fees (3.75%)</span>
                </div>
                <span className="text-white font-semibold">{formatCurrency(analytics.revenue.platformFees)}</span>
              </div>
              
              {analytics.revenue.xpassRevenue > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-400/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-yellow-200">X Pass Fees (5%)</span>
                  </div>
                  <span className="text-white font-semibold">{formatCurrency(analytics.revenue.xpassFees)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Insights
            </CardTitle>
            <CardDescription className="text-blue-200">
              Key business metrics and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
              <h4 className="text-blue-200 font-medium mb-2 flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Revenue Efficiency
              </h4>
              <p className="text-blue-300 text-sm mb-2">
                You keep <strong>{formatPercentage((analytics.revenue.studioEarnings / analytics.revenue.total) * 100)}</strong> of your revenue
              </p>
              <p className="text-blue-300 text-sm">
                vs ClassPass studios who keep only 40-50%
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
              <h4 className="text-green-200 font-medium mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Class Utilization
              </h4>
              <p className="text-green-300 text-sm">
                Average utilization: <strong>{formatPercentage(analytics.classes.averageUtilization)}</strong>
              </p>
              {analytics.classes.averageUtilization < 70 && (
                <p className="text-green-400 text-sm mt-1">
                  💡 Consider promotional pricing to increase bookings
                </p>
              )}
            </div>

            {analytics.xpass.redemptions > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                <h4 className="text-yellow-200 font-medium mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  X Pass Impact
                </h4>
                <p className="text-yellow-300 text-sm">
                  <strong>{analytics.xpass.redemptions}</strong> X Pass redemptions generated <strong>{formatCurrency(analytics.revenue.xpassRevenue)}</strong>
                </p>
                <p className="text-yellow-400 text-sm mt-1">
                  95% revenue share vs other platforms' 40-50%
                </p>
              </div>
            )}

            <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4">
              <h4 className="text-purple-200 font-medium mb-2">Revenue per Class</h4>
              <p className="text-purple-300 text-sm">
                <strong>{formatCurrency(analytics.classes.totalClasses > 0 ? analytics.revenue.total / analytics.classes.totalClasses : 0)}</strong> average per class
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-400/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-400" />
            Thryve vs Competition
          </CardTitle>
          <CardDescription className="text-green-200">
            See how much more you earn with Thryve's fair revenue model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4 text-center">
              <h3 className="text-red-200 font-semibold mb-2">ClassPass</h3>
              <div className="text-2xl font-bold text-white mb-2">40-50%</div>
              <div className="text-red-300 text-sm">Studio Revenue Share</div>
              <div className="text-red-300 text-sm mt-2">
                You'd earn: {formatCurrency(analytics.revenue.total * 0.45)}
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4 text-center">
              <h3 className="text-yellow-200 font-semibold mb-2">Other Platforms</h3>
              <div className="text-2xl font-bold text-white mb-2">60-70%</div>
              <div className="text-yellow-300 text-sm">Studio Revenue Share</div>
              <div className="text-yellow-300 text-sm mt-2">
                You'd earn: {formatCurrency(analytics.revenue.total * 0.65)}
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4 text-center">
              <Badge className="bg-green-500/20 text-green-200 mb-2">Best Choice</Badge>
              <h3 className="text-green-200 font-semibold mb-2">Thryve</h3>
              <div className="text-2xl font-bold text-white mb-2">
                {formatPercentage((analytics.revenue.studioEarnings / analytics.revenue.total) * 100)}
              </div>
              <div className="text-green-300 text-sm">Studio Revenue Share</div>
              <div className="text-green-300 text-sm mt-2">
                You earn: {formatCurrency(analytics.revenue.studioEarnings)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-green-200 text-lg font-medium">
              Extra earnings with Thryve: {formatCurrency(analytics.revenue.studioEarnings - (analytics.revenue.total * 0.45))}
            </p>
            <p className="text-green-300 text-sm mt-1">
              compared to ClassPass rates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}