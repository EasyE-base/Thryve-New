'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Trophy, Bell, Heart, TrendingUp, Activity, Award, Star, Dumbbell, LogOut, User, CalendarDays, BarChart3, PieChart, Filter, Search, ChevronLeft, ChevronRight, BookOpen, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

// Sample data for the dashboard
const sampleData = {
  weeklyAttendance: [
    { day: 'Mon', classes: 2 },
    { day: 'Tue', classes: 1 },
    { day: 'Wed', classes: 3 },
    { day: 'Thu', classes: 2 },
    { day: 'Fri', classes: 1 },
    { day: 'Sat', classes: 4 },
    { day: 'Sun', classes: 2 }
  ],
  classTypes: [
    { name: 'Yoga', value: 40, color: '#8B5CF6' },
    { name: 'HIIT', value: 30, color: '#EF4444' },
    { name: 'Pilates', value: 20, color: '#10B981' },
    { name: 'Strength', value: 10, color: '#F59E0B' }
  ],
  attendanceTrend: [
    { month: 'Jan', classes: 12 },
    { month: 'Feb', classes: 15 },
    { month: 'Mar', classes: 18 },
    { month: 'Apr', classes: 22 },
    { month: 'May', classes: 25 },
    { month: 'Jun', classes: 28 }
  ],
  favorites: [
    { id: 1, name: 'Zen Yoga Studio', type: 'studio', rating: 4.9, image: null },
    { id: 2, name: 'Sarah Johnson', type: 'instructor', rating: 4.8, image: null },
    { id: 3, name: 'FitCore Gym', type: 'studio', rating: 4.7, image: null },
    { id: 4, name: 'Mike Rodriguez', type: 'instructor', rating: 4.9, image: null }
  ],
  notifications: [
    { id: 1, type: 'reminder', message: 'Morning Yoga starts in 30 minutes', time: '30m ago' },
    { id: 2, type: 'waitlist', message: 'Spot available in HIIT Bootcamp', time: '2h ago' },
    { id: 3, type: 'change', message: 'Instructor changed for Pilates class', time: '1d ago' }
  ],
  events: [
    {
      id: 1,
      title: 'Morning Yoga',
      start: new Date(2024, 5, 15, 8, 0),
      end: new Date(2024, 5, 15, 9, 0),
      resource: { type: 'Yoga', instructor: 'Sarah Johnson' }
    },
    {
      id: 2,
      title: 'HIIT Bootcamp',
      start: new Date(2024, 5, 15, 18, 0),
      end: new Date(2024, 5, 15, 19, 0),
      resource: { type: 'HIIT', instructor: 'Mike Rodriguez' }
    },
    {
      id: 3,
      title: 'Pilates Core',
      start: new Date(2024, 5, 16, 10, 0),
      end: new Date(2024, 5, 16, 11, 0),
      resource: { type: 'Pilates', instructor: 'Emma Chen' }
    }
  ]
}

export default function CustomerDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [calendarView, setCalendarView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    if (role && role !== 'customer') {
      router.push(`/dashboard/${role}`)
      return
    }

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [user, role, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const eventStyleGetter = (event, start, end, isSelected) => {
    const typeColors = {
      'Yoga': '#8B5CF6',
      'HIIT': '#EF4444',
      'Pilates': '#10B981',
      'Strength': '#F59E0B'
    }
    
    const backgroundColor = typeColors[event.resource?.type] || '#3B82F6'
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-light">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Thryve</h1>
                <p className="text-blue-200 text-sm">Customer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <span className="text-white font-medium">Welcome back!</span>
                  <p className="text-blue-200 text-sm">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-white hover:text-blue-400 hover:bg-white/10 border border-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Thryve?</span> 💪
              </h2>
              <p className="text-xl text-blue-200">
                Your fitness journey continues! Here's what's happening today.
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 font-medium">This Week</p>
                      <p className="text-3xl font-bold text-white">5</p>
                      <p className="text-sm text-blue-300">Classes Booked</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 font-medium">Total Attended</p>
                      <p className="text-3xl font-bold text-white">28</p>
                      <p className="text-sm text-blue-300">Classes</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                      <Trophy className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 font-medium">Loyalty Points</p>
                      <p className="text-3xl font-bold text-white">1,240</p>
                      <p className="text-sm text-blue-300">+50 this week</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 font-medium">Streak</p>
                      <p className="text-3xl font-bold text-white">7</p>
                      <p className="text-sm text-blue-300">Days active</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                      <Flame className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Classes */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Upcoming Classes
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Your next 3 scheduled classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sampleData.events.slice(0, 3).map((event, index) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <p className="text-sm text-blue-200">{event.resource?.instructor}</p>
                          <p className="text-xs text-blue-300">{format(event.start, 'MMM dd, h:mm a')}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-200">
                        {event.resource?.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleData.notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{notification.message}</p>
                        <p className="text-blue-300 text-xs mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Class Calendar</h2>
              <div className="flex items-center space-x-4">
                <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      calendarView === 'month' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      calendarView === 'week' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    Week
                  </button>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="h-96">
                  <Calendar
                    localizer={localizer}
                    events={sampleData.events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={calendarView}
                    onView={setCalendarView}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event) => {
                      toast.info(`Selected: ${event.title} with ${event.resource?.instructor}`)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Activity Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Attendance */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Weekly Attendance</CardTitle>
                  <CardDescription className="text-blue-200">
                    Classes attended this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleData.weeklyAttendance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Bar dataKey="classes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Types */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Class Types</CardTitle>
                  <CardDescription className="text-blue-200">
                    Distribution of classes booked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sampleData.classTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sampleData.classTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trend */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Attendance Trend</CardTitle>
                <CardDescription className="text-blue-200">
                  Your progress over the past 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleData.attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="classes" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">My Favorites</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sampleData.favorites.map((favorite) => (
                <Card key={favorite.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        {favorite.type === 'studio' ? (
                          <MapPin className="h-8 w-8 text-white" />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{favorite.name}</h3>
                      <div className="flex items-center justify-center mb-4">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-blue-200 ml-1">{favorite.rating}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full"
                        onClick={() => toast.success('Booking feature coming soon!')}
                      >
                        Book Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}