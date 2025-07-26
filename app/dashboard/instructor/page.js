'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Users, DollarSign, Plus, Edit, Trash2, LogOut, User, Dumbbell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

export default function InstructorDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
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

    if (user) {
      loadInstructorData()
    }
  }, [user, role, authLoading, router])

  const loadInstructorData = async () => {
    try {
      const response = await fetch('/api/instructor/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to load instructor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
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
                <h1 className="text-2xl font-bold text-white">Thryve Instructor</h1>
                <p className="text-blue-200 text-sm">Instructor Dashboard</p>
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
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Teach, <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Inspire</span>, Earn 💪
          </h2>
          <p className="text-xl text-blue-200">
            Manage your classes, connect with students, and grow your fitness business
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-white">{classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">
                    {classes.reduce((sum, c) => sum + (c.bookings?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Earnings (Est.)</p>
                  <p className="text-3xl font-bold text-white">
                    ${Math.round(classes.reduce((sum, c) => sum + (c.price * (c.bookings?.length || 0) * 0.85), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Upcoming</p>
                  <p className="text-3xl font-bold text-white">
                    {classes.filter(c => new Date(c.schedule) > new Date()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/instructor/create-class">
              <Card className="group cursor-pointer bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Create New Class</h4>
                  <p className="text-blue-200">Design and schedule your next class</p>
                </CardContent>
              </Card>
            </Link>
            
            <Card 
              className="group cursor-pointer bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300"
              onClick={() => toast.info('Schedule view coming soon!')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">View Schedule</h4>
                <p className="text-blue-200">Manage your upcoming classes</p>
              </CardContent>
            </Card>
            
            <Card 
              className="group cursor-pointer bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300"
              onClick={() => toast.info('Stripe Connect integration coming soon!')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Setup Payments</h4>
                <p className="text-blue-200">Connect Stripe to receive payments</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Classes Overview */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Your Classes ({classes.length})
            </h3>
            <Link href="/instructor/create-class">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </Link>
          </div>

          {classes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first class to start teaching and earning money.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{classItem.title}</CardTitle>
                        {classItem.type && (
                          <Badge variant="secondary" className="mt-1">
                            {classItem.type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {classItem.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(classItem.schedule), 'MMM dd, yyyy')}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {format(new Date(classItem.schedule), 'h:mm a')}
                        {classItem.duration && ` (${classItem.duration} min)`}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {classItem.bookings?.length || 0} / {classItem.capacity} spots
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${classItem.price} per person
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Est. Earnings:</span>
                          <span className="font-medium">
                            ${Math.round(classItem.price * (classItem.bookings?.length || 0) * 0.85)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started as an Instructor</CardTitle>
              <CardDescription>
                Follow these steps to maximize your success on Thryve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium">Setup Stripe Connect</h4>
                      <p className="text-sm text-gray-600">Connect your bank account to receive payments</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium">Create Your First Class</h4>
                      <p className="text-sm text-gray-600">Add a detailed class with schedule and pricing</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium">Optimize Your Profile</h4>
                      <p className="text-sm text-gray-600">Add photos, certifications, and detailed bio</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium">Promote Your Classes</h4>
                      <p className="text-sm text-gray-600">Share your classes on social media</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}