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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Thryve Instructor</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user?.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Instructor! 💪
          </h2>
          <p className="text-gray-600">
            Manage your classes, view bookings, and grow your fitness business.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.reduce((sum, c) => sum + (c.bookings?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Earnings (Est.)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.round(classes.reduce((sum, c) => sum + (c.price * (c.bookings?.length || 0) * 0.85), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.filter(c => new Date(c.schedule) > new Date()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-24 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Create New Class</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>View Schedule</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2">
              <DollarSign className="h-6 w-6" />
              <span>Setup Stripe Connect</span>
            </Button>
          </div>
        </div>

        {/* Classes Overview */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Your Classes ({classes.length})
            </h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
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