'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users, Calendar as CalendarIcon, DollarSign, Plus, BarChart3, Settings, LogOut, User, TrendingUp, Activity, CreditCard, Package, Bot, Search, Bell, ChevronUp, ChevronDown, Eye, Edit, Trash2, Download, Filter, MapPin, Clock, Star, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import StudioStaffingDashboard from '@/components/StudioStaffingDashboard'

const localizer = momentLocalizer(moment)

export default function MerchantDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [studioClasses, setStudioClasses] = useState([])
  const [availableInstructors, setAvailableInstructors] = useState([])
  const [studioProfile, setStudioProfile] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [calendarView, setCalendarView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const router = useRouter()

  // Fetch studio profile and dashboard data
  const fetchStudioData = async () => {
    if (!user) return

    try {
      // Fetch studio profile
      const token = await user.getIdToken()
      const profileResponse = await fetch('/server-api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setStudioProfile(profileData.profile)
      }

      // Fetch dashboard analytics if available
      const analyticsResponse = await fetch('/server-api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setDashboardData(analyticsData)
      }

      // Fetch studio classes
      const classesResponse = await fetch('/server-api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (classesResponse.ok) {
        const classesData = await classesResponse.json()
        setStudioClasses(classesData.classes || [])
      }

    } catch (error) {
      console.error('Error fetching studio data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    if (role && role !== 'merchant') {
      router.push(`/dashboard/${role}`)
      return
    }

    fetchStudioData()
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
          <p className="text-white text-xl font-light">Loading Merchant Dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'classes', label: 'Classes', icon: CalendarIcon },
    { id: 'staffing', label: 'Staffing', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: User },
    { id: 'instructors', label: 'Instructors', icon: User },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'ai-tools', label: 'AI Tools', icon: Bot }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
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
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  {studioProfile?.studioName || studioProfile?.name || user?.email || 'Studio Manager'}
                </p>
                <p className="text-blue-200 text-xs">Studio Manager</p>
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
                <h1 className="text-3xl font-bold text-white">
                  {activeSection === 'dashboard' && 'Dashboard Overview'}
                  {activeSection === 'classes' && 'Class Management'}
                  {activeSection === 'staffing' && 'Staffing Management'}
                  {activeSection === 'calendar' && 'Calendar & Scheduling'}
                  {activeSection === 'analytics' && 'Advanced Analytics'}
                  {activeSection === 'clients' && 'Client Management'}
                  {activeSection === 'instructors' && 'Instructor Management'}
                  {activeSection === 'payments' && 'Payments & Financials'}
                  {activeSection === 'packages' && 'Packages & Memberships'}
                  {activeSection === 'settings' && 'Settings & Customization'}
                  {activeSection === 'ai-tools' && 'AI Tools & Insights'}
                </h1>
                <p className="text-blue-200">Welcome to your studio management hub</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg pl-10 pr-4 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Bell className="h-6 w-6 text-white" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2">
                  <span className="text-white font-medium">This Month</span>
                  <ChevronDown className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-screen">
            
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-semibold">
                        Welcome to {studioProfile?.studioName || studioProfile?.name || 'Your Studio'}!
                      </h3>
                      <p className="text-blue-200">
                        {studioClasses.length === 0 
                          ? "Let's get your studio set up. Start by creating your first class or use our AI Configuration Wizard."
                          : `You have ${studioClasses.length} classes configured and ready for bookings.`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {studioClasses.length === 0 && (
                    <div className="mt-4 flex space-x-3">
                      <Button 
                        onClick={() => router.push('/studio/create-class')}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Class
                      </Button>
                      <Button 
                        onClick={() => router.push('/ai-configuration-wizard')}
                        variant="outline"
                        className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        AI Setup Wizard
                      </Button>
                    </div>
                  )}
                </div>

                {/* KPIs Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-blue-200 text-sm font-medium">Total Revenue</h4>
                          <p className="text-2xl font-bold text-white">
                            ${dashboardData?.totalRevenue || '0'}
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            <span className="text-blue-300">
                              {dashboardData?.totalRevenue ? 'this month' : 'No revenue data yet'}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-blue-200 text-sm font-medium">Total Bookings</h4>
                          <p className="text-2xl font-bold text-white">
                            {dashboardData?.totalBookings || '0'}
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            <span className="text-blue-300">
                              {dashboardData?.totalBookings ? 'this month' : 'No bookings yet'}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-blue-200 text-sm font-medium">Active Classes</h4>
                          <p className="text-2xl font-bold text-white">
                            {studioClasses.length}
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            <span className="text-blue-300">
                              {studioClasses.length > 0 ? 'currently scheduled' : 'Create your first class'}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-blue-200 text-sm font-medium">New Clients</h4>
                          <p className="text-2xl font-bold text-white">
                            {dashboardData?.newClients || '0'}
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            <span className="text-blue-300">
                              {dashboardData?.newClients ? 'this week' : 'No new clients yet'}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Plus className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Create New Class</h4>
                        <p className="text-blue-200 text-sm mb-4">Add a new class to your schedule</p>
                        <Button 
                          onClick={() => router.push('/studio/create-class')}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        >
                          Create Class
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Settings className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Studio Settings</h4>
                        <p className="text-blue-200 text-sm mb-4">Configure your studio preferences</p>
                        <Button 
                          onClick={() => setActiveSection('settings')}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                        >
                          Manage Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">View Analytics</h4>
                        <p className="text-blue-200 text-sm mb-4">Track your studio performance</p>
                        <Button 
                          onClick={() => setActiveSection('analytics')}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                          View Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Activity</CardTitle>
                      <CardDescription className="text-blue-200">
                        Latest updates from your studio
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-white text-sm">{activity.message}</p>
                              <p className="text-blue-300 text-xs">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {/* Staffing Management */}
            {activeSection === 'staffing' && (
              <div className="space-y-6">
                <StudioStaffingDashboard />
              </div>
            )}

            {/* Calendar Section */}
            {activeSection === 'calendar' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Filters</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
                      <button
                        onClick={() => setCalendarView('day')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          calendarView === 'day' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-blue-200 hover:text-white'
                        }`}
                      >
                        Day
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
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <select className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option>All Instructors</option>
                      <option>Sarah Johnson</option>
                      <option>Mike Rodriguez</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    <select className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option>All Locations</option>
                      <option>Studio A</option>
                      <option>Studio B</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-blue-400" />
                    <select className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option>All Classes</option>
                      <option>Yoga</option>
                      <option>HIIT</option>
                      <option>Pilates</option>
                    </select>
                  </div>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="h-96">
                      <Calendar
                        localizer={localizer}
                        events={merchantData.events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={calendarView}
                        onView={setCalendarView}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => {
                          toast.info(`${event.title} - ${event.resource?.booked}/${event.resource?.capacity} booked`)
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trends */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Revenue Trends</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-200">Daily</Badge>
                        <Badge className="bg-purple-500/20 text-purple-200">Monthly</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={merchantData.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
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
                              dataKey="revenue" 
                              stroke="#10B981" 
                              strokeWidth={3}
                              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Class Fill Rates */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Class Fill Rates</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className="bg-green-500/20 text-green-200">By Time</Badge>
                        <Badge className="bg-yellow-500/20 text-yellow-200">By Instructor</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={merchantData.classFillRates}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                color: 'white'
                              }}
                            />
                            <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Client Retention & Booking Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Client Retention</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-200">30 Days</Badge>
                        <Badge className="bg-green-500/20 text-green-200">90 Days</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <Users className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-white text-lg font-medium">Client Retention Analytics</p>
                          <p className="text-blue-200">Coming soon with cohort analysis</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Booking Heatmap</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className="bg-purple-500/20 text-purple-200">Week</Badge>
                        <Badge className="bg-yellow-500/20 text-yellow-200">Month</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                          <p className="text-white text-lg font-medium">Booking Heatmap</p>
                          <p className="text-blue-200">Popular time slots visualization</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Clients Section */}
            {activeSection === 'clients' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        className="bg-white/10 backdrop-blur-md border-white/20 border rounded-lg pl-10 pr-4 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Badge className="bg-blue-500/20 text-blue-200">All</Badge>
                      <Badge className="bg-green-500/20 text-green-200">Active</Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-200">New</Badge>
                    </div>
                  </div>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-blue-200 border-b border-white/10">
                            <th className="pb-3 font-medium">Client</th>
                            <th className="pb-3 font-medium">Package Status</th>
                            <th className="pb-3 font-medium">Last Visit</th>
                            <th className="pb-3 font-medium">Attendance</th>
                            <th className="pb-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {merchantData.clients.map((client) => (
                            <tr key={client.id} className="border-b border-white/5">
                              <td className="py-4">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                      {client.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-white">{client.name}</p>
                                    <p className="text-sm text-blue-200">{client.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <Badge className={`${client.status === 'Active' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                                  {client.package}
                                </Badge>
                              </td>
                              <td className="py-4">
                                <p className="text-white">{client.lastVisit}</p>
                              </td>
                              <td className="py-4">
                                <p className="text-white">{client.attendance}</p>
                              </td>
                              <td className="py-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={() => toast.info(`Viewing details for ${client.name}`)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Instructors Section */}
            {activeSection === 'instructors' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Instructor & Staff Management</h3>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    onClick={() => toast.success('Add Instructor feature coming soon!')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Instructor
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merchantData.instructors.map((instructor) => (
                    <Card key={instructor.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-4 ring-2 ring-blue-400/50">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {instructor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <h4 className="text-lg font-semibold text-white mb-1">{instructor.name}</h4>
                          <p className="text-blue-200 text-sm mb-3">{instructor.role}</p>
                          <div className="flex items-center justify-center mb-3">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-blue-200 ml-1">{instructor.rating}</span>
                          </div>
                          <p className="text-sm text-blue-300 mb-4">{instructor.classes} classes this month</p>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-white/20 text-white hover:bg-white/10 flex-1"
                              onClick={() => toast.info(`Assigning classes to ${instructor.name}`)}
                            >
                              Assign Classes
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => toast.info(`Viewing ${instructor.name}'s performance`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Section */}
            {activeSection === 'payments' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Next Payout</p>
                          <p className="text-2xl font-bold text-white">$2,450</p>
                          <p className="text-sm text-blue-300">in 3 days</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">This Week</p>
                          <p className="text-2xl font-bold text-white">$1,890</p>
                          <p className="text-sm text-blue-300">+12% from last week</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">This Month</p>
                          <p className="text-2xl font-bold text-white">$8,420</p>
                          <p className="text-sm text-blue-300">+8% from last month</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Transaction History</CardTitle>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-200">All</Badge>
                        <Badge className="bg-green-500/20 text-green-200">Completed</Badge>
                        <Badge className="bg-yellow-500/20 text-yellow-200">Pending</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => toast.success('Export feature coming soon!')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-white text-lg font-medium">Payment History</p>
                      <p className="text-blue-200">Transaction history will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Packages Section */}
            {activeSection === 'packages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Packages & Memberships</h3>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    onClick={() => toast.success('Create Package feature coming soon!')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Package
                  </Button>
                </div>

                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-medium">Package Management</p>
                  <p className="text-blue-200">Create and manage class packages, memberships, and pricing</p>
                </div>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Studio Settings</h3>
                      <p className="text-blue-200">
                        Configure your studio settings, branding, and policies
                      </p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        onClick={() => router.push('/settings')}
                      >
                        Go to Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Tools Section */}
            {activeSection === 'ai-tools' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Smart Data Importer</h4>
                        <p className="text-blue-200 text-sm mb-4">AI-powered data import for seamless studio onboarding</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => router.push('/data-import')}
                        >
                          Import Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Settings className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">AI Configuration Wizard</h4>
                        <p className="text-blue-200 text-sm mb-4">Intelligent studio setup with AI recommendations</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => router.push('/ai-configuration-wizard')}
                        >
                          Configure Studio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Bot className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Smart Recommendations</h4>
                        <p className="text-blue-200 text-sm mb-4">AI-generated class recommendations based on booking patterns</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => router.push('/ai-dashboard')}
                        >
                          Get Recommendations
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <CalendarIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Schedule Optimization</h4>
                        <p className="text-blue-200 text-sm mb-4">Smart schedule optimization for maximum utilization</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => toast.info('Schedule Optimization coming soon!')}
                        >
                          Optimize Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">Predictive Analytics</h4>
                        <p className="text-blue-200 text-sm mb-4">Churn risk analysis and high-ROI time slot predictions</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => toast.info('Predictive Analytics coming soon!')}
                        >
                          View Predictions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}