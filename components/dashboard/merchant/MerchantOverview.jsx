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

  // ✅ CALCULATE METRICS FROM REAL DATA
  const todayClasses = classes?.filter(cls => isToday(new Date(cls.startTime || cls.date))) || []
  const tomorrowClasses = classes?.filter(cls => isTomorrow(new Date(cls.startTime || cls.date))) || []
  const todayBookings = bookings?.filter(booking => isToday(new Date(booking.createdAt || booking.date))) || []
  
  // Use real data from API response
  const overview = useDashboard().data?.overview || {}
  const studioData = useDashboard().data?.studio || {}
  
  const totalRevenue = overview.totalRevenue || 0
  const confirmedRevenue = overview.confirmedRevenue || 0
  const totalBookings = overview.totalBookings || 0
  const confirmedBookings = overview.confirmedBookings || 0

  const totalCustomers = overview.totalCustomers || 0
  const totalInstructors = overview.totalInstructors || 0
  const totalClasses = overview.totalClasses || 0

  // Calculate fill rate based on real data
  const fillRate = totalClasses > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0
  const noShowRate = totalBookings > 0 ? Math.round(((totalBookings - confirmedBookings) / totalBookings) * 100) : 0

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
                {studioData?.name || 'Your Studio'}
              </h1>
              <p className="text-blue-100">
                {studioData?.type || 'Fitness Studio'} • {studioData?.location || 'Location'}
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
              title="Total Revenue"
              value={totalRevenue}
              format="currency"
              icon={DollarSign}
              color="green"
              subtitle="All time"
            />
            
            <MetricCard
              title="Total Customers"
              value={totalCustomers}
              format="number"
              icon={Users}
              color="blue"
              subtitle="Active customers"
            />
            
            <MetricCard
              title="Fill Rate"
              value={fillRate}
              format="percentage"
              icon={TrendingUp}
              color="purple"
              subtitle="Booking success rate"
            />
            
            <MetricCard
              title="Total Classes"
              value={totalClasses}
              format="number"
              icon={Calendar}
              color="orange"
              subtitle="Classes created"
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
                <p className="text-sm text-gray-400 mt-1">You haven't created any classes yet</p>
                <Button 
                  variant="link" 
                  className="text-[#1E90FF]"
                  onClick={() => updateSection('classes')}
                >
                  Create your first class
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
              <span className="text-sm text-gray-600">Total Instructors</span>
              <span className="font-semibold">{totalInstructors}</span>
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
            <div className="text-center py-4">
              <div className="text-gray-500 mb-3">
                X Pass not configured yet
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Enable X Pass to increase your studio's visibility
              </p>
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => updateSection('xpass')}
              >
                Set up X Pass
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((booking, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {booking.status === 'confirmed' ? 'Booking confirmed' : 'New booking'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.className || 'Class'} - {format(new Date(booking.createdAt), 'MMM dd, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-gray-400">Bookings will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}