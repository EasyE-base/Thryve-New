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
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Thryve Business</h1>
                <p className="text-blue-200 text-sm">Studio Owner Dashboard</p>
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
            Grow Your <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Studio</span> 🏢
          </h2>
          <p className="text-xl text-blue-200">
            Manage your team, track performance, and scale your fitness business
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Total Members</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Classes Today</p>
                  <p className="text-3xl font-bold text-white">0</p>
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
                  <p className="text-blue-200 font-medium">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-white">$0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-blue-200 font-medium">Growth</p>
                  <p className="text-3xl font-bold text-white">+0%</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/dashboard/merchant/staff">
              <Card className="group cursor-pointer bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Add Instructor</h4>
                  <p className="text-blue-200">Invite new team members</p>
                </CardContent>
              </Card>
            </Link>
            
            <Card 
              className="group cursor-pointer bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300"
              onClick={() => toast.info('Schedule management coming soon!')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Manage Schedule</h4>
                <p className="text-blue-200">Plan classes and events</p>
              </CardContent>
            </Card>
            
            <Card 
              className="group cursor-pointer bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300"
              onClick={() => toast.info('Analytics dashboard coming soon!')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">View Analytics</h4>
                <p className="text-blue-200">Track business performance</p>
              </CardContent>
            </Card>
            
            <Link href="/settings">
              <Card className="group cursor-pointer bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Studio Settings</h4>
                  <p className="text-blue-200">Configure your business</p>
                </CardContent>
              </Card>
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
                <Link href="/dashboard/merchant/staff">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Instructor
                  </Button>
                </Link>
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