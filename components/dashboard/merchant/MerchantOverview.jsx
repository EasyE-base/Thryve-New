'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import MetricCard from '@/components/dashboard/MetricCard'
import { RevenueChart, BookingsChart } from '@/components/dashboard/ChartComponents'
import { MetricCardLoading } from '@/components/dashboard/LoadingStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DollarSign, Users, Calendar, TrendingUp, Plus, 
  Clock, Star, AlertCircle, CheckCircle, Zap,
  Building2, Activity, CreditCard, BarChart3
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'

// ✅ MERCHANT OVERVIEW DASHBOARD
export default function MerchantOverview() {
  const { 
    loading, 
    studio, 
    analytics, 
    revenue, 
    classes, 
    bookings, 
    instructors, 
    customers,
    xPassData,
    updateSection,
    createClass 
  } = useDashboard()

  // ✅ CALCULATE METRICS
  const todayClasses = classes?.filter(cls => isToday(new Date(cls.date))) || []
  const tomorrowClasses = classes?.filter(cls => isTomorrow(new Date(cls.date))) || []
  const todayBookings = bookings?.filter(booking => isToday(new Date(booking.date))) || []
  
  const totalRevenue = revenue?.total || 0
  const monthlyRevenue = revenue?.thisMonth || 0
  const weeklyRevenue = revenue?.thisWeek || 0
  const revenueGrowth = revenue?.growth || 0

  const totalCustomers = customers?.length || 0
  const activeCustomers = customers?.filter(c => c.status === 'active').length || 0
  const customerGrowth = analytics?.customerGrowth || 0

  const totalInstructors = instructors?.length || 0
  const activeInstructors = instructors?.filter(i => i.status === 'active').length || 0

  const fillRate = analytics?.averageFillRate || 0
  const noShowRate = analytics?.noShowRate || 0

  // ✅ QUICK ACTIONS
  const quickActions = [
    {
      label: 'Create Class',
      icon: Plus,
      color: 'blue',
      action: () => updateSection('classes')
    },
    {
      label: 'Manage Instructors',
      icon: Users,
      color: 'green',
      action: () => updateSection('instructors')
    },
    {
      label: 'View Analytics',
      icon: BarChart3,
      color: 'purple',
      action: () => updateSection('analytics')
    },
    {
      label: 'X Pass Settings',
      icon: Zap,
      color: 'orange',
      action: () => updateSection('xpass')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-[#1E90FF] to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {studio?.name || 'Your Studio'}
              </h1>
              <p className="text-blue-100">
                {studio?.type || 'Fitness Studio'} • {studio?.location || 'Location'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {format(new Date(), 'MMM dd')}
            </div>
            <div className="text-blue-100">
              {todayClasses.length} classes today
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <MetricCardLoading />
            <MetricCardLoading />
            <MetricCardLoading />
            <MetricCardLoading />
          </>
        ) : (
          <>
            <MetricCard
              title="Monthly Revenue"
              value={monthlyRevenue}
              format="currency"
              icon={DollarSign}
              color="green"
              trend={revenueGrowth}
              trendDirection={revenueGrowth >= 0 ? 'up' : 'down'}
              subtitle="This month"
            />
            
            <MetricCard
              title="Active Customers"
              value={activeCustomers}
              format="number"
              icon={Users}
              color="blue"
              trend={customerGrowth}
              trendDirection={customerGrowth >= 0 ? 'up' : 'down'}
              subtitle={`${totalCustomers} total`}
            />
            
            <MetricCard
              title="Average Fill Rate"
              value={fillRate}
              format="percentage"
              icon={TrendingUp}
              color="purple"
              subtitle="Last 30 days"
            />
            
            <MetricCard
              title="Today's Bookings"
              value={todayBookings.length}
              format="number"
              icon={Calendar}
              color="orange"
              subtitle="Scheduled today"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart 
          data={revenue?.chartData || []} 
          loading={loading}
          title="Revenue Trend"
        />
        
        <BookingsChart 
          data={analytics?.bookingsData || []} 
          loading={loading}
          title="Booking Activity"
        />
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('calendar')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No classes scheduled for today</p>
                <Button 
                  variant="link" 
                  className="text-[#1E90FF]"
                  onClick={() => updateSection('classes')}
                >
                  Create a class
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.slice(0, 4).map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(cls.startTime), 'h:mm a')} • {cls.instructor}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={cls.status === 'full' ? 'destructive' : 'secondary'}
                      className={cls.status === 'full' ? 'bg-red-100 text-red-700' : ''}
                    >
                      {cls.booked}/{cls.capacity}
                    </Badge>
                  </div>
                ))}
                
                {todayClasses.length > 4 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-[#1E90FF]"
                    onClick={() => updateSection('calendar')}
                  >
                    View {todayClasses.length - 4} more classes
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                const colorVariants = {
                  blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
                  green: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
                  purple: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
                  orange: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                }
                
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`h-20 flex flex-col space-y-2 ${colorVariants[action.color]}`}
                    onClick={action.action}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Stats & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Studio Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Studio Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fill Rate</span>
              <span className="font-semibold">{fillRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${fillRate}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">No-Show Rate</span>
              <span className="font-semibold">{noShowRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${noShowRate}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Instructors</span>
              <span className="font-semibold">{activeInstructors}/{totalInstructors}</span>
            </div>
          </CardContent>
        </Card>

        {/* X Pass Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">X Pass</CardTitle>
            <Zap className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {xPassData?.enabled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monthly Bookings</span>
                  <span className="font-semibold">{xPassData.monthlyBookings || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Share</span>
                  <span className="font-semibold text-green-600">
                    ${xPassData.monthlyRevenue || 0}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => updateSection('xpass')}
                >
                  Manage X Pass
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-500 mb-3">
                  X Pass not enabled
                </div>
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => updateSection('xpass')}
                >
                  Enable X Pass
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Mock recent activities */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">New booking</div>
                  <div className="text-xs text-gray-500">Yoga class - 2 min ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Instructor joined</div>
                  <div className="text-xs text-gray-500">Sarah M. - 1 hour ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Class cancelled</div>
                  <div className="text-xs text-gray-500">HIIT class - 3 hours ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}