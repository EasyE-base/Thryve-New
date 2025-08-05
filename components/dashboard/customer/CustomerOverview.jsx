'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import MetricCard from '@/components/dashboard/MetricCard'
import { ActivityChart } from '@/components/dashboard/ChartComponents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, TrendingUp, Star, Zap, 
  Clock, Users, MapPin, Heart, 
  Bot, Target, Award, BookOpen
} from 'lucide-react'
import { format, isToday, addDays } from 'date-fns'

export default function CustomerOverview() {
  const { 
    profile, 
    myBookings, 
    recommendedClasses, 
    membershipStatus, 
    xPassCredits, 
    loyaltyPoints,
    updateSection,
    bookClass 
  } = useDashboard()

  // ✅ UPCOMING BOOKINGS
  const upcomingBookings = myBookings?.filter(booking => 
    new Date(booking.date) >= new Date()
  ) || []
  
  const todayClasses = upcomingBookings.filter(booking => 
    isToday(new Date(booking.date))
  )

  // ✅ AI RECOMMENDATIONS  
  const aiRecommendations = recommendedClasses?.slice(0, 3) || [
    {
      id: 1,
      name: 'Beginner Yoga Flow',
      studio: 'Zen Wellness',
      instructor: 'Sarah M.',
      time: '7:00 PM',
      date: format(addDays(new Date(), 1), 'MMM dd'),
      rating: 4.9,
      reason: 'Based on your yoga preferences',
      image: null,
      price: 25,
      xPassEligible: true
    },
    {
      id: 2,
      name: 'HIIT Cardio Blast',
      studio: 'FitZone',
      instructor: 'Mike C.',
      time: '6:00 AM',
      date: format(addDays(new Date(), 2), 'MMM dd'),
      rating: 4.7,
      reason: 'High-energy workout you love',
      image: null,
      price: 30,
      xPassEligible: false
    },
    {
      id: 3,
      name: 'Mindful Meditation',
      studio: 'Peaceful Path',
      instructor: 'Lisa K.',
      time: '12:00 PM',
      date: format(addDays(new Date(), 3), 'MMM dd'),
      rating: 5.0,
      reason: 'Perfect for stress relief',
      image: null,
      price: 20,
      xPassEligible: true
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#1E90FF] to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white/20">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {profile?.firstName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Hello, {profile?.firstName || 'Fitness Enthusiast'}!
              </h1>
              <p className="text-blue-100">
                {membershipStatus?.type || 'Free Member'} • {loyaltyPoints || 250} points earned
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
          title="Classes This Month"
          value={myBookings?.length || 12}
          format="number"
          icon={Calendar}
          color="blue"
          trend={8}
          trendDirection="up"
          subtitle="vs last month"
        />
        
        <MetricCard
          title="Loyalty Points"
          value={loyaltyPoints || 250}
          format="number"
          icon={Award}
          color="purple"
          subtitle="Redeem rewards"
        />
        
        <MetricCard
          title="X Pass Credits"
          value={xPassCredits || 5}
          format="number"
          icon={Zap}
          color="orange"
          subtitle="Cross-studio visits"
        />
        
        <MetricCard
          title="Favorite Studio"
          value="Zen Wellness"
          format="text"
          icon={Heart}
          color="red"
          subtitle="Most visited"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Classes</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('bookings')}
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
                  onClick={() => updateSection('discover')}
                >
                  Discover classes
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1E90FF] rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{booking.className || 'Yoga Class'}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(booking.time || new Date()), 'h:mm a')} • {booking.studio || 'Studio'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">
                        Booked
                      </Badge>
                      {booking.xPass && (
                        <div className="text-xs text-orange-600 mt-1">
                          X Pass
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-[#1E90FF]" />
              <span>AI Recommendations</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateSection('discover')}
            >
              See More
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{rec.name}</h4>
                        {rec.xPassEligible && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            X Pass
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{rec.studio}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{rec.instructor}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{rec.date} • {rec.time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{rec.rating}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Target className="h-3 w-3" />
                          <span className="text-xs">{rec.reason}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-3">
                      <div className="font-semibold text-green-600">${rec.price}</div>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => bookClass(rec.id)}
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membership Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E90FF] to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg">
                  {membershipStatus?.type || 'Free Member'}
                </h3>
                <p className="text-sm text-gray-600">
                  {membershipStatus?.status || 'Active'}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Classes this month</span>
                  <span className="font-medium">
                    {membershipStatus?.classesUsed || 8}/{membershipStatus?.classesAllowed || 'Unlimited'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Renewal date</span>
                  <span className="font-medium">
                    {membershipStatus?.renewalDate || 'Feb 15, 2024'}
                  </span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Manage Membership
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* X Pass Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>X Pass</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {xPassCredits || 5}
                </div>
                <div className="text-sm text-gray-600">Credits Available</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Studios available</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="font-medium">Mar 15, 2024</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => updateSection('xpass')}
                >
                  Explore Studios
                </Button>
                <Button variant="outline" className="w-full">
                  Buy More Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classes attended</span>
                  <span className="font-semibold">12</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total calories burned</span>
                  <span className="font-semibold">3,240</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Favorite activity</span>
                  <span className="font-semibold">Yoga</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Streak</span>
                  <span className="font-semibold text-green-600">7 days</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => updateSection('bookings')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <ActivityChart 
        data={[
          { month: 'Sep', classes: 8 },
          { month: 'Oct', classes: 12 },
          { month: 'Nov', classes: 15 },
          { month: 'Dec', classes: 10 },
          { month: 'Jan', classes: 12 }
        ]} 
        title="Your Fitness Journey"
      />
    </div>
  )
}