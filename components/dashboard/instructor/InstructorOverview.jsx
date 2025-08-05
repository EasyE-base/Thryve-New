'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import MetricCard from '@/components/dashboard/MetricCard'
import { EarningsChart } from '@/components/dashboard/ChartComponents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DollarSign, Calendar, Users, Star, Clock, 
  CheckCircle, AlertCircle, ArrowRight, MessageSquare
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'

export default function InstructorOverview() {
  const { 
    profile, 
    assignedClasses, 
    earnings, 
    performance, 
    swapRequests, 
    updateSection 
  } = useDashboard()

  // ✅ TODAY'S CLASSES
  const todayClasses = assignedClasses?.filter(cls => 
    isToday(new Date(cls.date))
  ) || []
  
  const tomorrowClasses = assignedClasses?.filter(cls => 
    isTomorrow(new Date(cls.date))
  ) || []

  // ✅ UPCOMING SWAP REQUESTS
  const pendingSwaps = swapRequests?.filter(swap => 
    swap.status === 'pending'
  ) || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#1E90FF] to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white/20">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {profile?.firstName?.charAt(0) || 'I'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.firstName || 'Instructor'}!
              </h1>
              <p className="text-blue-100">
                {profile?.specialties?.join(', ') || 'Fitness Instructor'} • {profile?.studio || 'Studio'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {todayClasses.length}
            </div>
            <div className="text-blue-100">
              {todayClasses.length === 1 ? 'class today' : 'classes today'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="This Month's Earnings"
          value={earnings?.thisMonth || 2400}
          format="currency"
          icon={DollarSign}
          color="green"
          trend={earnings?.growth || 8}
          trendDirection="up"
          subtitle="vs last month"
        />
        
        <MetricCard
          title="Classes This Month"
          value={performance?.classesThisMonth || 24}
          format="number"
          icon={Calendar}
          color="blue"
          subtitle={`${assignedClasses?.length || 8} upcoming`}
        />
        
        <MetricCard
          title="Average Rating"
          value={performance?.avgRating || 4.8}
          format="decimal"
          icon={Star}
          color="orange"
          subtitle="From students"
        />
        
        <MetricCard
          title="Fill Rate"
          value={performance?.fillRate || 85}
          format="percentage"
          icon={Users}
          color="purple"
          subtitle="Class capacity"
        />
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Classes</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('schedule')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No classes scheduled for today</p>
                <p className="text-sm">Enjoy your day off!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{cls.name || 'Yoga Class'}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(cls.startTime || new Date()), 'h:mm a')} • {cls.studio || 'Studio'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {cls.booked || 8}/{cls.capacity || 15}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        ${cls.payment || 50}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Earnings Overview</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('earnings')}
            >
              View Details
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="text-2xl font-bold text-green-600">
                  ${earnings?.thisWeek || 600}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="text-lg font-semibold">
                  ${earnings?.thisMonth || 2400}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Earned</span>
                <span className="text-lg font-semibold">
                  ${earnings?.total || 18500}
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Next Payout</span>
                  <span className="font-medium">
                    {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Requests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Swap Requests</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('swaps')}
            >
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            {pendingSwaps.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No pending swap requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSwaps.slice(0, 3).map((swap, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <div className="text-sm">
                        <div className="font-medium">{swap.className}</div>
                        <div className="text-gray-500">{swap.date}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {pendingSwaps.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{pendingSwaps.length - 3} more requests
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Classes */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Tomorrow's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowClasses.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No classes tomorrow</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tomorrowClasses.slice(0, 3).map((cls, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-gray-500">
                        {format(new Date(cls.startTime || new Date()), 'h:mm a')}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cls.booked || 5}/{cls.capacity || 15}
                    </Badge>
                  </div>
                ))}
                
                {tomorrowClasses.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{tomorrowClasses.length - 3} more classes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => updateSection('schedule')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => updateSection('swaps')}
              >
                <Users className="h-4 w-4 mr-2" />
                Request Cover
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => updateSection('messages')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => updateSection('earnings')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Earnings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <EarningsChart 
        data={earnings?.chartData || []} 
        title="Earnings Trend"
      />
    </div>
  )
}