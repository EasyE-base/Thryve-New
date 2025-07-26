'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, User, Mail, Phone, Shield, Bell, CreditCard, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    bio: '',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  })
  const router = useRouter()

  useEffect(() => {
    // Load user profile data from localStorage or API
    if (typeof window !== 'undefined') {
      const onboardingData = localStorage.getItem('onboardingComplete')
      if (onboardingData) {
        try {
          const data = JSON.parse(onboardingData)
          if (data.uid === user?.uid) {
            setProfileData(prev => ({
              ...prev,
              firstName: data.profileData?.firstName || '',
              lastName: data.profileData?.lastName || '',
              phone: data.profileData?.phone || '',
              bio: data.profileData?.bio || data.profileData?.fitnessGoals || ''
            }))
          }
        } catch (e) {
          console.error('Failed to parse profile data:', e)
        }
      }
    }
  }, [user])

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // In production, this would make an API call
      // For now, we'll update localStorage
      const existingData = localStorage.getItem('onboardingComplete')
      if (existingData) {
        const data = JSON.parse(existingData)
        data.profileData = { ...data.profileData, ...profileData }
        localStorage.setItem('onboardingComplete', JSON.stringify(data))
      }
      
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Clear all local data
        localStorage.clear()
        await signOut()
        toast.success('Account deleted successfully')
        router.push('/')
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  const getDashboardPath = () => {
    return `/dashboard/${role || 'customer'}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href={getDashboardPath()}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">
                    {profileData.firstName && profileData.lastName 
                      ? `${profileData.firstName[0]}${profileData.lastName[0]}`
                      : user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications from Thryve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.notifications.email}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.notifications.push}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-gray-500">Receive text message updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.notifications.sms}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-gray-500">Last updated 30 days ago</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Payments */}
          {role === 'customer' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Billing & Payments
                </CardTitle>
                <CardDescription>
                  Manage your payment methods and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Methods</h4>
                    <p className="text-sm text-gray-500">No payment methods added</p>
                  </div>
                  <Button variant="outline">Add Payment Method</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Billing History</h4>
                    <p className="text-sm text-gray-500">View past transactions</p>
                  </div>
                  <Button variant="outline">View History</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Trash2 className="h-5 w-5 mr-2" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-600">Delete Account</h4>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}