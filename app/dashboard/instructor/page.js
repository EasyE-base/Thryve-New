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
import StripeConnectButton from '@/components/StripeConnectButton'

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
  const { user, role } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [instructor, setInstructor] = useState(null)
  const [payouts, setPayouts] = useState([])
  const [instructorClasses, setInstructorClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [calendarView, setCalendarView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [checklist, setChecklist] = useState(instructorData.dailyChecklist)

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!user) {
        router.push('/?signin=true')
        return
      }

      if (role && role !== 'instructor') {
        router.push(`/dashboard/${role}`)
        return
      }

      try {
        const token = await user.getIdToken()
        
        // Fetch instructor profile
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/instructor/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (profileResponse.ok) {
          const instructorData = await profileResponse.json()
          setInstructor(instructorData)
          
          // Check for Stripe Connect success/refresh parameters
          const urlParams = new URLSearchParams(window.location.search)
          if (urlParams.get('success') === 'true') {
            setStripeConnectSuccess(true)
            toast.success('Stripe account connected successfully!')
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
          }
          
          // Fetch payouts if instructor has active Stripe account
          if (instructorData.stripeAccountStatus === 'active') {
            const payoutsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/instructor/payouts`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (payoutsResponse.ok) {
              const payoutsData = await payoutsResponse.json()
              setPayouts(payoutsData)
            }
          }

          // Fetch instructor's classes
          const classesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/instructor/classes`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            setInstructorClasses(classesData.classes || [])
          }

        } else if (profileResponse.status === 404) {
          toast.error('Instructor profile not found. Please complete your instructor onboarding.')
          router.push('/onboarding/instructor')
          return
        }
      } catch (error) {
        console.error('Error fetching instructor data:', error)
        toast.error('Failed to load instructor data')
      } finally {
        setLoading(false)
      }
    }

    fetchInstructorData()
  }, [user, role, router])

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
            
            {/* Dashboard Overview */}
            {activeSection === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Side */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Upcoming Classes */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Upcoming Classes</h3>
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        View All →
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {instructorData.upcomingClasses.map((classItem) => (
                        <Card key={classItem.id} className="bg-white/10 backdrop-blur-md border-white/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-1 h-12 rounded-full ${
                                  classItem.color === 'green' ? 'bg-green-500' : 
                                  classItem.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                                }`}></div>
                                <div>
                                  <h4 className="font-medium text-white">{classItem.name}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-blue-200">
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {classItem.location}
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {classItem.time}
                                    </div>
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-1" />
                                      {classItem.booked}/{classItem.capacity}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                  onClick={() => toast.success('Starting class...')}
                                >
                                  Start Class
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={() => toast.info('Viewing roster...')}
                                >
                                  Roster
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Performance Overview */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Performance Overview</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-200 text-sm">This Month</span>
                        <ChevronDown className="h-4 w-4 text-blue-200" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-blue-200 text-sm">Classes Taught</p>
                            <p className="text-2xl font-bold text-white">{instructorData.performance.classesThisMonth}</p>
                            <div className="flex items-center justify-center mt-1">
                              <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                              <span className="text-green-400 text-xs">+{instructorData.performance.fillRateChange}% vs last month</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-blue-200 text-sm">Avg. Fill Rate</p>
                            <p className="text-2xl font-bold text-white">{instructorData.performance.fillRate}%</p>
                            <div className="flex items-center justify-center mt-1">
                              <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                              <span className="text-green-400 text-xs">+{instructorData.performance.ratingChange}% vs last month</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-blue-200 text-sm">Avg. Rating</p>
                            <p className="text-2xl font-bold text-white">{instructorData.performance.avgRating}</p>
                            <div className="flex items-center justify-center mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-6">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={instructorData.performanceChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="week" stroke="#9CA3AF" />
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
                  </div>

                  {/* AI Tools */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">
                        <Bot className="h-5 w-5 text-pink-400 inline mr-2" />
                        AI Tools Coming Soon
                      </h3>
                    </div>
                    
                    <p className="text-blue-200 mb-6">Exciting new features powered by AI to help you be more efficient</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-6 w-6 text-blue-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Class Plan Generator</h4>
                            <p className="text-blue-200 text-sm">Create personalized class plans in seconds</p>
                            <Button size="sm" className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                              Coming Soon
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="h-6 w-6 text-purple-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Smart Feedback</h4>
                            <p className="text-blue-200 text-sm">Generate personalized feedback for your students</p>
                            <Button size="sm" className="mt-4 bg-purple-500 hover:bg-purple-600 text-white">
                              Coming Soon
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <BarChart3 className="h-6 w-6 text-green-400" />
                            </div>
                            <h4 className="text-white font-medium mb-2">Attendance Prediction</h4>
                            <p className="text-blue-200 text-sm">Forecast class attendance based on historical data</p>
                            <Button size="sm" className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                              Coming Soon
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Recent Messages</h3>
                      <button 
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        onClick={() => setActiveSection('messages')}
                      >
                        View All →
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {instructorData.messages.map((message) => (
                        <Card key={message.id} className="bg-white/10 backdrop-blur-md border-white/20">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                  {message.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-white font-medium">{message.sender}</p>
                                    {message.unread && (
                                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    )}
                                  </div>
                                  <span className="text-blue-300 text-xs">{message.time}</span>
                                </div>
                                <p className="text-blue-200 text-sm mt-1">{message.message}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                  {/* Daily Checklist */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Daily Checklist</h3>
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Add Item +
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {checklist.map((item) => (
                        <Card key={item.id} className="bg-white/10 backdrop-blur-md border-white/20">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <button
                                onClick={() => toggleChecklistItem(item.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                  item.completed 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-white/30 hover:border-white/50'
                                }`}
                              >
                                {item.completed && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  item.completed ? 'text-green-300 line-through' : 'text-white'
                                }`}>
                                  {item.task}
                                </p>
                                <p className="text-blue-200 text-xs mt-1">{item.note}</p>
                                <div className="flex items-center mt-2">
                                  <Badge className={`text-xs ${
                                    item.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                                    item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                                    'bg-blue-500/20 text-blue-200'
                                  }`}>
                                    {item.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Earnings Overview */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Earnings Overview</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-200 text-sm">June</span>
                        <ChevronDown className="h-4 w-4 text-blue-200" />
                      </div>
                    </div>
                    
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-4">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-blue-200 text-sm">Estimated for June</p>
                          <p className="text-3xl font-bold text-white">${instructorData.earnings.monthlyTotal}</p>
                          <div className="flex items-center justify-center mt-1">
                            <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                            <span className="text-green-400 text-xs">+{instructorData.earnings.monthlyChange}% vs May</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {instructorData.earnings.classes.map((classItem, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium text-sm">{classItem.name}</p>
                            <p className="text-blue-200 text-xs">{classItem.classes} classes</p>
                          </div>
                          <p className="text-white font-medium">${classItem.earnings}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <p className="text-blue-200 text-sm font-medium mb-3">Bonus Tracker</p>
                      <div className="space-y-3">
                        {instructorData.earnings.bonuses.map((bonus, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-white text-sm">{bonus.name}</p>
                              <p className="text-blue-200 text-xs">{bonus.progress}%</p>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${bonus.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule & Calendar */}
            {activeSection === 'schedule' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Schedule & Calendar</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
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
                        onClick={() => setCalendarView('day')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          calendarView === 'day' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-blue-200 hover:text-white'
                        }`}
                      >
                        Day
                      </button>
                    </div>
                  </div>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="h-96">
                      <Calendar
                        localizer={localizer}
                        events={instructorData.events}
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

            {/* Class Management */}
            {activeSection === 'classes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Class Management</h3>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    onClick={() => router.push('/instructor/create-class')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructorData.upcomingClasses.map((classItem) => (
                    <Card key={classItem.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className={`${
                            classItem.type === 'Yoga' ? 'bg-green-500/20 text-green-200' :
                            classItem.type === 'HIIT' ? 'bg-red-500/20 text-red-200' :
                            'bg-blue-500/20 text-blue-200'
                          }`}>
                            {classItem.type}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-semibold text-white mb-2">{classItem.name}</h4>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-blue-200 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            {classItem.location}
                          </div>
                          <div className="flex items-center text-blue-200 text-sm">
                            <Clock className="h-4 w-4 mr-2" />
                            {classItem.time}
                          </div>
                          <div className="flex items-center text-blue-200 text-sm">
                            <Users className="h-4 w-4 mr-2" />
                            {classItem.booked}/{classItem.capacity} booked
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
                            onClick={() => toast.success('Viewing roster...')}
                          >
                            View Roster
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => toast.success('Marking attendance...')}
                          >
                            Attendance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Dashboard */}
            {activeSection === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Total Classes</p>
                          <p className="text-2xl font-bold text-white">{instructorData.instructor.totalClasses}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Average Rating</p>
                          <p className="text-2xl font-bold text-white">{instructorData.instructor.rating}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <Star className="h-6 w-6 text-yellow-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Fill Rate</p>
                          <p className="text-2xl font-bold text-white">{instructorData.performance.fillRate}%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={instructorData.performanceChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="week" stroke="#9CA3AF" />
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
                            dataKey="fillRate" 
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

            {/* Messages */}
            {activeSection === 'messages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">Messages</h3>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    onClick={() => toast.success('Compose message coming soon!')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Compose
                  </Button>
                </div>

                <div className="space-y-4">
                  {instructorData.messages.map((message) => (
                    <Card key={message.id} className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12 ring-2 ring-blue-400/50">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                              {message.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <p className="text-white font-medium">{message.sender}</p>
                                {message.unread && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                )}
                              </div>
                              <span className="text-blue-300 text-sm">{message.time}</span>
                            </div>
                            <p className="text-blue-200 mb-4">{message.message}</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => toast.success('Reply feature coming soon!')}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Earnings */}
            {activeSection === 'earnings' && (
              <div className="space-y-6">
                {/* Stripe Connect Status */}
                {instructor && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-400" />
                        <span>Payment Setup</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StripeConnectButton instructor={instructor} />
                    </CardContent>
                  </Card>
                )}

                {/* Earnings Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">This Month</p>
                          <p className="text-2xl font-bold text-white">
                            ${instructor?.stripeAccountStatus === 'active' && payouts.length > 0 
                              ? payouts.reduce((sum, payout) => sum + payout.amount, 0).toFixed(2)
                              : '0.00'
                            }
                          </p>
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
                          <p className="text-blue-200 font-medium text-sm">Total Payouts</p>
                          <p className="text-2xl font-bold text-white">{payouts.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 font-medium text-sm">Platform Fee</p>
                          <p className="text-2xl font-bold text-white">
                            {instructor?.commissionRate 
                              ? `${(instructor.commissionRate * 100).toFixed(0)}%`
                              : '15%'
                            }
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Payouts */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Payouts</CardTitle>
                    <CardDescription className="text-blue-200">
                      Your latest earnings from class bookings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {instructor?.stripeAccountStatus === 'active' ? (
                      payouts.length > 0 ? (
                        <div className="space-y-4">
                          {payouts.slice(0, 10).map((payout, index) => (
                            <div key={payout._id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white font-medium">Class Booking Payout</p>
                                <p className="text-blue-200 text-sm">
                                  {new Date(payout.createdAt).toLocaleDateString()} • 
                                  Platform fee: ${payout.platformFee?.toFixed(2) || '0.00'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">${payout.amount?.toFixed(2) || '0.00'}</p>
                                <Badge 
                                  variant={payout.status === 'paid' ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    payout.status === 'paid' 
                                      ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                                  }`}
                                >
                                  {payout.status || 'pending'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <DollarSign className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                          <p className="text-blue-200 text-lg mb-2">No payouts yet</p>
                          <p className="text-blue-300 text-sm">
                            Start teaching classes to earn your first payout!
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <p className="text-yellow-300 text-lg mb-2">Payment Setup Required</p>
                        <p className="text-blue-200 text-sm">
                          Connect your Stripe account above to start receiving payments from your classes.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Earnings Tips */}
                <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-2" />
                      Maximize Your Earnings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Maintain High Ratings</p>
                          <p className="text-blue-200">Students book higher-rated instructors more often</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Offer Regular Classes</p>
                          <p className="text-blue-200">Consistent scheduling builds a loyal student base</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Engage with Students</p>
                          <p className="text-blue-200">Personal connections lead to repeat bookings</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium">Complete Your Profile</p>
                          <p className="text-blue-200">Detailed profiles attract more students</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <User className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Profile Settings</h3>
                      <p className="text-blue-200">
                        Manage your profile, certifications, and preferences
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
          </div>
        </div>
      </div>
    </div>
  )
}