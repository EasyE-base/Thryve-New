'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, Calendar, DollarSign, Plus, BarChart3, Settings, LogOut, User, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function MerchantDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
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
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Thryve Business</h1>
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
            Welcome back, Studio Owner! 🏢
          </h2>
          <p className="text-gray-600">
            Manage your studio, track performance, and grow your fitness business.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Classes Today</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Growth</p>
                  <p className="text-2xl font-bold text-gray-900">+0%</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-24 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Add Instructor</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>Studio Settings</span>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your studio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600 mb-4">
                  Activity will appear here once you start managing your studio.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructors Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Instructors</CardTitle>
                  <CardDescription>Manage your teaching staff</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instructor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors yet</h3>
                <p className="text-gray-600 mb-4">
                  Invite instructors to start offering classes at your studio.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Instructor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classes Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Manage your class schedule</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                <p className="text-gray-600 mb-4">
                  Work with your instructors to schedule classes.
                </p>
                <Button>View Schedule</Button>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Track your business performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics coming soon</h3>
                <p className="text-gray-600 mb-4">
                  Detailed analytics will be available once you have bookings.
                </p>
                <Button variant="outline">Learn More</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started as a Studio Owner</CardTitle>
              <CardDescription>
                Follow these steps to set up and grow your fitness business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h4 className="font-medium">Complete Studio Profile</h4>
                      <p className="text-sm text-gray-600">Add photos, amenities, and operating hours</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h4 className="font-medium">Invite Instructors</h4>
                      <p className="text-sm text-gray-600">Add qualified instructors to teach at your studio</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h4 className="font-medium">Setup Payment Processing</h4>
                      <p className="text-sm text-gray-600">Configure Stripe Connect for automated payouts</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h4 className="font-medium">Schedule Classes</h4>
                      <p className="text-sm text-gray-600">Work with instructors to create a class schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                    <div>
                      <h4 className="font-medium">Promote Your Studio</h4>
                      <p className="text-sm text-gray-600">Market your studio to attract new members</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                    <div>
                      <h4 className="font-medium">Monitor Performance</h4>
                      <p className="text-sm text-gray-600">Use analytics to optimize your business</p>
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