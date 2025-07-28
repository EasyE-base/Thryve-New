'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Trophy, Bell, Heart, TrendingUp, Activity, Award, Star, Dumbbell, LogOut, User, CalendarDays, BarChart3, Filter, Search, ChevronLeft, ChevronRight, BookOpen, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export default function CustomerDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [calendarView, setCalendarView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dashboardData, setDashboardData] = useState({
    weeklyAttendance: [],
    classTypes: [],
    attendanceTrend: [],
    favorites: [],
    notifications: [],
    events: []
  })
  const router = useRouter()

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      
      // Fetch user's booking/attendance data
      const bookingsResponse = await fetch('/server-api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      let weeklyAttendance = []
      let classTypes = []
      let attendanceTrend = []
      let events = []
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        const bookings = bookingsData.bookings || []
        
        // Process bookings for charts
        weeklyAttendance = processWeeklyAttendance(bookings)
        classTypes = processClassTypes(bookings)
        attendanceTrend = processAttendanceTrend(bookings)
        events = processEventsFromBookings(bookings)
      }

      // Fetch user's favorites
      const favoritesResponse = await fetch('/server-api/user/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      let favorites = []
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json()
        favorites = favoritesData.favorites || []
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/server-api/notifications/inbox', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      let notifications = []
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        notifications = notificationsData.notifications || []
      }

      setDashboardData({
        weeklyAttendance,
        classTypes,
        attendanceTrend,
        favorites,
        notifications,
        events
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty data structure on error
      setDashboardData({
        weeklyAttendance: [],
        classTypes: [],
        attendanceTrend: [],
        favorites: [],
        notifications: [],
        events: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to process weekly attendance from bookings
  const processWeeklyAttendance = (bookings) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weekData = days.map(day => ({ day, classes: 0 }))
    
    bookings.forEach(booking => {
      if (booking.date) {
        const bookingDate = new Date(booking.date)
        const dayIndex = (bookingDate.getDay() + 6) % 7 // Convert to Mon=0 format
        weekData[dayIndex].classes += 1
      }
    })
    
    return weekData
  }

  // Helper function to process class types from bookings
  const processClassTypes = (bookings) => {
    const typeColors = {
      'Yoga': '#8B5CF6',
      'HIIT': '#EF4444', 
      'Pilates': '#10B981',
      'Strength': '#F59E0B',
      'Dance': '#EC4899',
      'Other': '#6B7280'
    }
    
    const typeCounts = {}
    bookings.forEach(booking => {
      const type = booking.type || 'Other'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      color: typeColors[name] || typeColors['Other']
    }))
  }

  // Helper function to process attendance trend from bookings
  const processAttendanceTrend = (bookings) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const trendData = []
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentYear, new Date().getMonth() - 5 + i, 1)
      const monthName = months[date.getMonth()]
      const classCount = bookings.filter(booking => {
        if (!booking.date) return false
        const bookingDate = new Date(booking.date)
        return bookingDate.getMonth() === date.getMonth() && bookingDate.getFullYear() === date.getFullYear()
      }).length
      
      trendData.push({ month: monthName, classes: classCount })
    }
    
    return trendData
  }

  // Helper function to process events from bookings
  const processEventsFromBookings = (bookings) => {
    return bookings.slice(0, 10).map(booking => ({
      id: booking.id,
      title: booking.title || booking.className || 'Class',
      start: new Date(booking.date + 'T' + (booking.time || '09:00')),
      end: new Date(booking.date + 'T' + (booking.time || '09:00')),
      resource: {
        type: booking.type || 'Class',
        instructor: booking.instructor || 'TBD'
      }
    })).filter(event => !isNaN(event.start))
  }

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

    // Fetch real dashboard data
    fetchDashboardData()
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

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: User }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Thryve</span>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-500/20 text-blue-200 border-l-2 border-blue-400'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* User Profile in Sidebar */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-white/10 bg-black/10">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">John Smith</p>
                <p className="text-blue-200 text-xs">Premium Member</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full text-white hover:text-blue-400 hover:bg-white/10 border border-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-black/10 backdrop-blur-md border-b border-white/10 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-blue-200">Good morning, John! Here's your fitness summary</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg pl-10 pr-4 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Bell className="h-6 w-6 text-white" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-screen">
            
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Overview</h2>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View All →
                  </button>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Classes Booked This Week</p>
                          <p className="text-3xl font-bold text-white">3</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Upcoming Classes</p>
                          <p className="text-3xl font-bold text-white">2</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <CalendarDays className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Total Classes Attended</p>
                          <p className="text-3xl font-bold text-white">42</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Loyalty Points</p>
                          <p className="text-3xl font-bold text-white">320</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <Award className="h-6 w-6 text-yellow-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Class Calendar */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Class Calendar</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-200 text-sm">June 2024</span>
                      <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
                        <button
                          onClick={() => setCalendarView('month')}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            calendarView === 'month' 
                              ? 'bg-blue-500 text-white' 
                              : 'text-blue-200 hover:text-white'
                          }`}
                        >
                          Month
                        </button>
                        <button
                          onClick={() => setCalendarView('week')}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
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
                </div>

                {/* Activity Analytics */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Activity Analytics</h3>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Attendance */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Weekly Attendance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.weeklyAttendance}>
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
                        <CardTitle className="text-white text-lg">Class Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sampleData.classTypes}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
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

                    {/* Attendance Trends */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Attendance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
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
                  </div>
                </div>

                {/* My Favorites */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">My Favorites</h3>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      View All →
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {sampleData.favorites.map((favorite) => (
                      <Card key={favorite.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                              {favorite.type === 'studio' ? (
                                <MapPin className="h-8 w-8 text-white" />
                              ) : (
                                <User className="h-8 w-8 text-white" />
                              )}
                            </div>
                            <h4 className="text-white font-semibold text-sm mb-1">{favorite.name}</h4>
                            <div className="flex items-center justify-center mb-3">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-blue-200 ml-1 text-sm">{favorite.rating}</span>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white w-full text-xs"
                              onClick={() => toast.success('Booking feature coming soon!')}
                            >
                              Book Again
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Notifications</h3>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Mark All as Read →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bell className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">Upcoming Class Reminder</p>
                                <p className="text-blue-200 text-sm">Your Spin class with Jessica is tomorrow at 6:30 PM. Don't forget to bring a water bottle!</p>
                                <p className="text-blue-300 text-xs mt-1">3 hours ago</p>
                              </div>
                              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">Class Time Change</p>
                                <p className="text-blue-200 text-sm">Your Morning Flow Yoga class on Friday has been moved from 7:00 AM to 7:30 AM.</p>
                                <p className="text-blue-300 text-xs mt-1">1 day ago</p>
                              </div>
                              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Award className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">Loyalty Reward Earned!</p>
                                <p className="text-blue-200 text-sm">Congratulations! You've earned 50 loyalty points for completing 10 classes this month.</p>
                                <p className="text-blue-300 text-xs mt-1">2 days ago</p>
                              </div>
                              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                Claim
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Community Feed */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Community Feed</h3>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              SJ
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-white font-medium">Sarah Johnson</p>
                              <Badge className="bg-blue-500/20 text-blue-200 text-xs">Instructor</Badge>
                            </div>
                            <p className="text-blue-200 text-sm mb-3">
                              Start your day with intention! Join my Morning Flow class tomorrow at 7AM for a gentle wake-up routine that will energize your whole day.
                            </p>
                            <div className="flex items-center space-x-6 text-blue-300 text-xs">
                              <button className="flex items-center space-x-1 hover:text-white">
                                <Heart className="h-4 w-4" />
                                <span>24</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-white">
                                <Users className="h-4 w-4" />
                                <span>8</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-white">
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10 ring-2 ring-purple-400/50">
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                              MP
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-white font-medium">Mike Peterson</p>
                              <Badge className="bg-purple-500/20 text-purple-200 text-xs">Instructor</Badge>
                            </div>
                            <p className="text-blue-200 text-sm mb-3">
                              Quick tip: Hydration is key for performance! Drink at least 16oz of water before your workout and keep sipping throughout your class.
                            </p>
                            <div className="flex items-center space-x-6 text-blue-300 text-xs">
                              <button className="flex items-center space-x-1 hover:text-white">
                                <Heart className="h-4 w-4" />
                                <span>42</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-white">
                                <Users className="h-4 w-4" />
                                <span>15</span>
                              </button>
                              <button className="flex items-center space-x-1 hover:text-white">
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Section */}
            {activeSection === 'calendar' && (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Notifications</h2>
                
                <div className="space-y-4">
                  {sampleData.notifications.map((notification) => (
                    <Card key={notification.id} className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-white text-sm">{notification.message}</p>
                            <p className="text-blue-300 text-xs mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Community Section */}
            {activeSection === 'community' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Community Feed</h2>
                
                <div className="space-y-4">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                            SJ
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-white font-medium">Sarah Johnson</p>
                            <Badge className="bg-blue-500/20 text-blue-200 text-xs">Instructor</Badge>
                          </div>
                          <p className="text-blue-200 text-sm mb-3">
                            Start your day with intention! Join my Morning Flow class tomorrow at 7AM for a gentle wake-up routine that will energize your whole day.
                          </p>
                          <div className="flex items-center space-x-6 text-blue-300 text-xs">
                            <button className="flex items-center space-x-1 hover:text-white">
                              <Heart className="h-4 w-4" />
                              <span>24</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-white">
                              <Users className="h-4 w-4" />
                              <span>8</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-white">
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10 ring-2 ring-purple-400/50">
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                            MP
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-white font-medium">Mike Peterson</p>
                            <Badge className="bg-purple-500/20 text-purple-200 text-xs">Instructor</Badge>
                          </div>
                          <p className="text-blue-200 text-sm mb-3">
                            Quick tip: Hydration is key for performance! Drink at least 16oz of water before your workout and keep sipping throughout your class.
                          </p>
                          <div className="flex items-center space-x-6 text-blue-300 text-xs">
                            <button className="flex items-center space-x-1 hover:text-white">
                              <Heart className="h-4 w-4" />
                              <span>42</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-white">
                              <Users className="h-4 w-4" />
                              <span>15</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-white">
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Settings</h2>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <User className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Settings Coming Soon</h3>
                      <p className="text-blue-200">
                        Profile settings and preferences will be available here.
                      </p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        onClick={() => router.push('/settings')}
                      >
                        Go to Settings Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}