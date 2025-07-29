'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Building2, Users, Calendar as CalendarIcon, DollarSign, Plus, BarChart3, Settings, LogOut, 
  User, TrendingUp, Activity, CreditCard, Package, Bot, Search, Bell, ChevronUp, ChevronDown, 
  Eye, Edit, Trash2, Download, Filter, MapPin, Clock, Star, AlertCircle, Home, Menu, X,
  ArrowUpRight, ArrowDownRight, Zap, Target, Award, CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import DebugUserRole from '@/components/DebugUserRole'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import StudioStaffingDashboard from '@/components/StudioStaffingDashboard'
import CommunicationDashboard from '@/components/CommunicationDashboard'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
      console.error('Error signing out:', error)
      toast.error('Error signing out')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#1E90FF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#7A7A7A]">Loading your studio dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Home, color: 'bg-[#1E90FF]/10 text-[#1E90FF]' },
    { id: 'classes', label: 'Classes', icon: CalendarIcon, color: 'bg-green-500/10 text-green-600' },
    { id: 'staffing', label: 'Staff', icon: Users, color: 'bg-purple-500/10 text-purple-600' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, color: 'bg-orange-500/10 text-orange-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-pink-500/10 text-pink-600' },
    { id: 'clients', label: 'Clients', icon: User, color: 'bg-indigo-500/10 text-indigo-600' },
    { id: 'instructors', label: 'Instructors', icon: User, color: 'bg-teal-500/10 text-teal-600' },
    { id: 'payments', label: 'Payments', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-600' },
    { id: 'ai-tools', label: 'AI Tools', icon: Bot, color: 'bg-violet-500/10 text-violet-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-gray-500/10 text-gray-600' }
  ]

  // Mock data for dashboard stats
  const statsData = [
    {
      title: 'Total Revenue',
      value: '$12,486',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Bookings Today',
      value: '42',
      change: '+8.2%',
      trend: 'up',
      icon: CalendarIcon,
      color: 'text-[#1E90FF]'
    },
    {
      title: 'Active Members',
      value: '1,247',
      change: '+5.7%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Class Fill Rate',
      value: '87%',
      change: '-2.1%',
      trend: 'down',
      icon: Target,
      color: 'text-orange-600'
    }
  ]

  // Mock recent classes data
  const recentClasses = [
    {
      id: 1,
      name: 'Morning Yoga Flow',
      instructor: 'Sarah Johnson',
      time: '7:00 AM',
      date: 'Today',
      booked: 15,
      capacity: 20,
      status: 'active'
    },
    {
      id: 2,
      name: 'HIIT Bootcamp',
      instructor: 'Mike Rodriguez',
      time: '6:30 PM',
      date: 'Today',
      booked: 18,
      capacity: 18,
      status: 'full'
    },
    {
      id: 3,
      name: 'Pilates Fundamentals',
      instructor: 'Emma Chen',
      time: '12:00 PM',
      date: 'Tomorrow',
      booked: 8,
      capacity: 15,
      status: 'active'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#EADBC8]/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#EADBC8]/20 rounded-lg transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="text-2xl font-bold text-[#1C1C1E]">
              Thryve
            </Link>
            <Badge className="bg-[#1E90FF]/10 text-[#1E90FF] border-[#1E90FF]/20">
              Studio Owner
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7A7A7A] h-4 w-4" />
              <input
                type="text"
                placeholder="Search classes, members..."
                className="bg-[#FAF9F6] border border-[#EADBC8] rounded-xl pl-10 pr-4 py-2 text-[#1C1C1E] placeholder-[#7A7A7A] focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] w-64"
              />
            </div>
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5 text-[#7A7A7A]" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-[#1E90FF]/20">
                <AvatarFallback className="bg-[#1E90FF] text-white">
                  {studioProfile?.studioName?.[0] || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[#1C1C1E]">
                  {studioProfile?.studioName || 'Studio Owner'}
                </p>
                <p className="text-xs text-[#7A7A7A]">Welcome back!</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-[#EADBC8]/30 min-h-screen transition-all duration-300`}>
          <div className="p-6">
            <div className={`${sidebarOpen ? 'block' : 'hidden'} mb-8`}>
              <h3 className="text-lg font-semibold text-[#1C1C1E] mb-2">Studio Management</h3>
              <p className="text-sm text-[#7A7A7A]">Everything you need to run your studio</p>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#1E90FF]/10 text-[#1E90FF] shadow-md border-l-4 border-[#1E90FF]'
                        : 'text-[#7A7A7A] hover:text-[#1C1C1E] hover:bg-[#EADBC8]/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? item.color : 'bg-gray-100 text-gray-500 group-hover:bg-[#EADBC8]/40'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* User Profile in Sidebar */}
          {sidebarOpen && (
            <div className="absolute bottom-0 w-72 p-6 border-t border-[#EADBC8]/30 bg-white">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-12 w-12 ring-2 ring-[#1E90FF]/20">
                  <AvatarFallback className="bg-gradient-to-br from-[#1E90FF] to-[#4A90E2] text-white">
                    {studioProfile?.studioName?.[0] || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1C1E] truncate">
                    {studioProfile?.studioName || 'Your Studio'}
                  </p>
                  <p className="text-xs text-[#7A7A7A] truncate">
                    {studioProfile?.businessType || 'Fitness Studio'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Content Header */}
          <div className="bg-white border-b border-[#EADBC8]/30 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-[#1C1C1E] mb-2">
                  {activeSection === 'dashboard' && 'Dashboard Overview'}
                  {activeSection === 'classes' && 'Class Management'}
                  {activeSection === 'staffing' && 'Staff Management'}
                  {activeSection === 'calendar' && 'Calendar & Scheduling'}
                  {activeSection === 'analytics' && 'Analytics & Insights'}
                  {activeSection === 'clients' && 'Member Management'}
                  {activeSection === 'instructors' && 'Instructor Management'}
                  {activeSection === 'payments' && 'Payments & Revenue'}
                  {activeSection === 'ai-tools' && 'AI-Powered Tools'}
                  {activeSection === 'settings' && 'Studio Settings'}
                </h1>
                <p className="text-[#7A7A7A]">
                  {activeSection === 'dashboard' && 'Track your studio performance at a glance'}
                  {activeSection === 'classes' && 'Create, manage, and optimize your class schedule'}
                  {activeSection === 'staffing' && 'Manage your team and instructor schedules'}
                  {activeSection === 'calendar' && 'View and manage all your studio activities'}
                  {activeSection === 'analytics' && 'Deep insights into your studio performance'}
                  {activeSection === 'clients' && 'Manage your member base and relationships'}
                  {activeSection === 'instructors' && 'Manage your instructor team and assignments'}
                  {activeSection === 'payments' && 'Track revenue, payments, and financial metrics'}
                  {activeSection === 'ai-tools' && 'AI-powered features to grow your studio'}
                  {activeSection === 'settings' && 'Customize your studio preferences and setup'}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button size="sm" variant="outline" className="border-[#EADBC8] text-[#7A7A7A] hover:bg-[#EADBC8]/20">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-[#1E90FF] hover:bg-[#1976D2] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Action
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 overflow-y-auto max-h-[calc(100vh-180px)]">
            
            {/* Dashboard Overview */}
            {activeSection === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] text-white">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          Welcome back, {studioProfile?.studioName || 'Studio Owner'}! 🎉
                        </h2>
                        <p className="text-blue-100 text-lg">
                          {studioClasses.length === 0 
                            ? "Ready to set up your studio? Let's get your first classes live!"
                            : `Your studio is thriving with ${studioClasses.length} active classes.`
                          }
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                          <Building2 className="h-12 w-12" />
                        </div>
                      </div>
                    </div>
                    
                    {studioClasses.length === 0 && (
                      <div className="mt-6 flex space-x-3">
                        <Button 
                          onClick={() => router.push('/studio/create-class')}
                          className="bg-white text-[#1E90FF] hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Class
                        </Button>
                        <Button 
                          onClick={() => router.push('/ai-configuration-wizard')}
                          variant="outline"
                          className="border-white text-white hover:bg-white/20"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Use AI Wizard
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsData.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-[#7A7A7A] font-medium">{stat.title}</p>
                              <p className="text-3xl font-bold text-[#1C1C1E] mt-2">{stat.value}</p>
                              <div className="flex items-center mt-2">
                                {stat.trend === 'up' ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm font-medium ${
                                  stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
                                }`}>
                                  {stat.change}
                                </span>
                                <span className="text-sm text-[#7A7A7A] ml-1">vs last month</span>
                              </div>
                            </div>
                            <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Classes */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-bold text-[#1C1C1E]">Recent Classes</CardTitle>
                          <Button size="sm" variant="ghost" className="text-[#1E90FF] hover:bg-[#1E90FF]/10">
                            View All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentClasses.map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-xl">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#1E90FF] to-[#4A90E2] rounded-xl flex items-center justify-center">
                                  <CalendarIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#1C1C1E]">{cls.name}</h4>
                                  <p className="text-sm text-[#7A7A7A]">with {cls.instructor}</p>
                                  <p className="text-xs text-[#7A7A7A]">{cls.date} at {cls.time}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <Badge className={`${
                                    cls.status === 'full' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {cls.booked}/{cls.capacity}
                                  </Badge>
                                  {cls.status === 'full' && (
                                    <Badge className="bg-red-100 text-red-700">Full</Badge>
                                  )}
                                </div>
                                <div className="mt-1">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-[#1E90FF] h-2 rounded-full" 
                                      style={{ width: `${(cls.booked / cls.capacity) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#1C1C1E]">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button className="w-full justify-start bg-[#1E90FF]/10 text-[#1E90FF] hover:bg-[#1E90FF]/20 h-12">
                          <Plus className="h-4 w-4 mr-3" />
                          Create New Class
                        </Button>
                        <Button className="w-full justify-start bg-green-500/10 text-green-600 hover:bg-green-500/20 h-12">
                          <Users className="h-4 w-4 mr-3" />
                          Manage Staff
                        </Button>
                        <Button className="w-full justify-start bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 h-12">
                          <BarChart3 className="h-4 w-4 mr-3" />
                          View Analytics
                        </Button>
                        <Button className="w-full justify-start bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 h-12">
                          <Settings className="h-4 w-4 mr-3" />
                          Studio Settings
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Performance Summary */}
                    <Card className="border-0 shadow-lg mt-6">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-[#1C1C1E]">This Month</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7A7A]">Total Bookings</span>
                          <span className="font-bold text-[#1C1C1E]">342</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7A7A]">Revenue</span>
                          <span className="font-bold text-green-600">$12,486</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7A7A]">New Members</span>
                          <span className="font-bold text-[#1E90FF]">28</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7A7A]">Avg. Class Fill</span>
                          <span className="font-bold text-purple-600">87%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
            
            {/* Class Management */}
            {activeSection === 'classes' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-[#1C1C1E]">Class Management</CardTitle>
                    <CardDescription>Create, edit, and manage your studio classes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <CalendarIcon className="h-16 w-16 text-[#7A7A7A] mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-[#1C1C1E] mb-2">Class Management System</h3>
                      <p className="text-[#7A7A7A] mb-6">Full class management interface coming soon</p>
                      <Button onClick={() => router.push('/studio/create-class')} className="bg-[#1E90FF] hover:bg-[#1976D2] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Class
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Staff Management */}
            {activeSection === 'staffing' && (
              <div className="space-y-6">
                <StudioStaffingDashboard />
              </div>
            )}
            
            {/* Calendar View */}
            {activeSection === 'calendar' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-[#1C1C1E]">Studio Calendar</CardTitle>
                    <CardDescription>View and manage your class schedule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <CalendarIcon className="h-16 w-16 text-[#7A7A7A] mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-[#1C1C1E] mb-2">Interactive Calendar</h3>
                      <p className="text-[#7A7A7A]">Drag-and-drop calendar interface coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics */}
            {activeSection === 'analytics' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-[#1C1C1E]">Analytics Dashboard</CardTitle>
                    <CardDescription>Deep insights into your studio performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-[#7A7A7A] mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-[#1C1C1E] mb-2">Advanced Analytics</h3>
                      <p className="text-[#7A7A7A]">Comprehensive analytics dashboard coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other sections with similar structure */}
            {['clients', 'instructors', 'payments', 'ai-tools', 'settings'].map((section) => (
              activeSection === section && (
                <div key={section} className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-[#1C1C1E] capitalize">
                        {section === 'ai-tools' ? 'AI Tools' : section} Management
                      </CardTitle>
                      <CardDescription>
                        {section === 'clients' && 'Manage your member base and relationships'}
                        {section === 'instructors' && 'Manage your instructor team'}
                        {section === 'payments' && 'Track revenue and payment processing'}
                        {section === 'ai-tools' && 'AI-powered features for your studio'}
                        {section === 'settings' && 'Configure your studio preferences'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <div className="h-16 w-16 bg-[#7A7A7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <div className="h-8 w-8 bg-[#7A7A7A]/20 rounded-full"></div>
                        </div>
                        <h3 className="text-xl font-semibold text-[#1C1C1E] mb-2 capitalize">
                          {section === 'ai-tools' ? 'AI Tools' : section} System
                        </h3>
                        <p className="text-[#7A7A7A]">Advanced {section} management coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}