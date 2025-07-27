'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar as CalendarIcon, Clock, Users, DollarSign, Plus, Edit, Trash2, LogOut, User, Dumbbell, Activity, BarChart3, MessageSquare, Settings, CheckCircle, AlertCircle, Star, Bell, Search, ChevronDown, PlayCircle, FileText, Send, CheckSquare, TrendingUp, Heart, MapPin, Filter, Upload, Eye, Check, X, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, addDays, isToday, isTomorrow } from 'date-fns'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

// Sample instructor data
const instructorData = {
  instructor: {
    name: 'Jane',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@thryve.com',
    role: 'Yoga Instructor',
    bio: 'Certified yoga instructor with 5+ years experience',
    rating: 4.8,
    totalClasses: 342,
    avatar: null
  },
  upcomingClasses: [
    {
      id: 1,
      name: 'Morning Flow Yoga',
      location: 'Studio A',
      time: '9:00 AM',
      date: 'Today',
      booked: 12,
      capacity: 15,
      type: 'Yoga',
      color: 'green'
    },
    {
      id: 2,
      name: 'HIIT Express',
      location: 'Studio B',
      time: '12:30 PM',
      date: 'Today',
      booked: 8,
      capacity: 10,
      type: 'HIIT',
      color: 'red'
    },
    {
      id: 3,
      name: 'Private Session - Sarah M.',
      location: 'Private Room 2',
      time: '3:00 PM',
      date: 'Today',
      booked: 1,
      capacity: 1,
      type: 'Private',
      color: 'blue'
    }
  ],
  dailyChecklist: [
    { id: 1, task: 'Prepare Morning Flow sequence', completed: false, priority: 'high', note: 'Focus on gentle warm-up for beginners' },
    { id: 2, task: 'Client Alert: Sarah M.', completed: false, priority: 'medium', note: 'Wrist injury - Modify poses for private session' },
    { id: 3, task: 'Welcome New Students', completed: false, priority: 'low', note: 'First-timers in Morning Flow' },
    { id: 4, task: 'Client Birthday: Michael T.', completed: false, priority: 'medium', note: 'Attending HIIT Express' },
    { id: 5, task: 'Update HIIT playlist', completed: false, priority: 'low', note: 'Add new tracks for today\'s session' }
  ],
  performance: {
    classesThisMonth: 42,
    fillRate: 87,
    avgRating: 4.8,
    fillRateChange: 12,
    ratingChange: 5
  },
  performanceChart: [
    { week: 'Week 1', classes: 12, fillRate: 85 },
    { week: 'Week 2', classes: 15, fillRate: 88 },
    { week: 'Week 3', classes: 9, fillRate: 82 },
    { week: 'Week 4', classes: 18, fillRate: 90 },
    { week: 'Week 5', classes: 16, fillRate: 87 },
    { week: 'Week 6', classes: 14, fillRate: 89 },
    { week: 'Week 7', classes: 17, fillRate: 91 },
    { week: 'Week 8', classes: 10, fillRate: 85 }
  ],
  messages: [
    { id: 1, sender: 'Sarah M.', avatar: 'SM', time: '10:23 AM', message: 'Hi Jane, just wanted to confirm our private session today at 3 PM. Also, my wrist is feeling better!', unread: true },
    { id: 2, sender: 'John W.', avatar: 'JW', time: 'Yesterday', message: 'Thanks for the great HIIT class yesterday! I was wondering if you could share the playlist?', unread: false },
    { id: 3, sender: 'Thryve Studio', avatar: 'TS', time: '2 days ago', message: 'Reminder: Staff meeting this Friday at 2 PM. We\'ll be discussing the new class schedule.', unread: false }
  ],
  earnings: {
    monthlyTotal: 2450,
    monthlyChange: 15,
    classes: [
      { name: 'Morning Flow Yoga', classes: 12, earnings: 960, rate: 80 },
      { name: 'HIIT Express', classes: 8, earnings: 720, rate: 90 },
      { name: 'Private Sessions', classes: 5, earnings: 750, rate: 150 }
    ],
    bonuses: [
      { name: 'High Attendance Bonus', progress: 75, target: 100 },
      { name: 'Perfect Attendance', progress: 100, target: 100 },
      { name: 'New Client Referrals', progress: 40, target: 100 }
    ]
  },
  events: [
    {
      id: 1,
      title: 'Morning Flow Yoga',
      start: new Date(2024, 5, 17, 9, 0),
      end: new Date(2024, 5, 17, 10, 0),
      resource: { type: 'Yoga', location: 'Studio A', booked: 12, capacity: 15 }
    },
    {
      id: 2,
      title: 'HIIT Express',
      start: new Date(2024, 5, 17, 12, 30),
      end: new Date(2024, 5, 17, 13, 30),
      resource: { type: 'HIIT', location: 'Studio B', booked: 8, capacity: 10 }
    },
    {
      id: 3,
      title: 'Private Session',
      start: new Date(2024, 5, 17, 15, 0),
      end: new Date(2024, 5, 17, 16, 0),
      resource: { type: 'Private', location: 'Private Room 2', booked: 1, capacity: 1 }
    }
  ]
}

export default function InstructorDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [calendarView, setCalendarView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [checklist, setChecklist] = useState(instructorData.dailyChecklist)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    if (role && role !== 'instructor') {
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

  const toggleChecklistItem = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const eventStyleGetter = (event, start, end, isSelected) => {
    const typeColors = {
      'Yoga': '#10B981',
      'HIIT': '#EF4444',
      'Private': '#3B82F6',
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
          <p className="text-white text-xl font-light">Loading Instructor Dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'classes', label: 'Classes', icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings }
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
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">Jane Doe</p>
                <p className="text-blue-200 text-xs">Yoga Instructor</p>
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
                  {activeSection === 'dashboard' && `Hi ${instructorData.instructor.firstName}, ready to lead today?`}
                  {activeSection === 'schedule' && 'Schedule & Calendar'}
                  {activeSection === 'classes' && 'Class Management'}
                  {activeSection === 'performance' && 'Performance Dashboard'}
                  {activeSection === 'messages' && 'Messages & Communication'}
                  {activeSection === 'earnings' && 'Earnings Overview'}
                  {activeSection === 'settings' && 'Settings & Profile'}
                </h1>
                <p className="text-blue-200">
                  {activeSection === 'dashboard' && `You have ${instructorData.upcomingClasses.length} classes scheduled for today`}
                  {activeSection !== 'dashboard' && 'Manage your teaching schedule and performance'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-md rounded-lg px-3 py-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MON</span>
                  </div>
                  <span className="text-white font-medium">June 12</span>
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