'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, Calendar, DollarSign, Plus, BarChart3, Settings, LogOut, User, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export default function MerchantDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/')
      return
    }

    // Check if user completed onboarding locally due to API issues
    if (typeof window !== 'undefined') {
      const onboardingComplete = localStorage.getItem('onboardingComplete')
      if (onboardingComplete) {
        try {
          const data = JSON.parse(onboardingComplete)
          if (data.uid === user.uid && data.role === 'merchant') {
            console.log('🔥 Using locally stored onboarding data for merchant dashboard')
            // Display a message that data will sync when server is available
            setTimeout(() => {
              toast.info('Welcome! Your profile data will sync with the server once it\'s fully available.')
            }, 1000)
          }
        } catch (e) {
          console.error('Failed to parse localStorage onboarding data:', e)
        }
      }
    }

    if (role && role !== 'merchant') {
      router.push(`/dashboard/${role}`)
      return
    }

    setLoading(false)
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
            <Link href="/dashboard/merchant/staff">
              <Button className="h-24 flex-col space-y-2 w-full">
                <Plus className="h-6 w-6" />
                <span>Add Instructor</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-24 flex-col space-y-2 w-full" onClick={() => toast.info('Schedule management coming soon!')}>
              <Calendar className="h-6 w-6" />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2 w-full" onClick={() => toast.info('Analytics dashboard coming soon!')}>
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Link href="/settings">
              <Button variant="outline" className="h-24 flex-col space-y-2 w-full">
                <Settings className="h-6 w-6" />
                <span>Studio Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Instructors Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Instructors</CardTitle>
              <CardDescription>Manage your fitness professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No instructors yet</h3>
                <p className="text-gray-600 mb-4">
                  Invite qualified instructors to join your studio and start offering classes.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Instructor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Classes & Schedule</CardTitle>
              <CardDescription>Manage your class offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                <p className="text-gray-600 mb-4">
                  Work with your instructors to create and schedule fitness classes.
                </p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started as a Studio Owner</CardTitle>
            <CardDescription>
              Follow these steps to set up your fitness business on Thryve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Complete Studio Profile</h4>
                    <p className="text-sm text-gray-600">Add photos, amenities, and business information</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">Invite Qualified Instructors</h4>
                    <p className="text-sm text-gray-600">Find and invite certified fitness professionals</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">Setup Payment Processing</h4>
                    <p className="text-sm text-gray-600">Configure Stripe Connect for seamless payments</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-medium">Create Class Schedule</h4>
                    <p className="text-sm text-gray-600">Work with instructors to plan diverse class offerings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                  <div>
                    <h4 className="font-medium">Launch & Promote</h4>
                    <p className="text-sm text-gray-600">Go live and start attracting customers</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                  <div>
                    <h4 className="font-medium">Monitor & Optimize</h4>
                    <p className="text-sm text-gray-600">Use analytics to grow your business</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}