'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  GraduationCap, 
  Building, 
  ArrowRight,
  CheckCircle,
  Star,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { updateUserRole } from '@/lib/firebase-auth'
import { toast } from 'sonner'

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const { user, refreshRole } = useAuth()

  // Check for pending role selection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingData = localStorage.getItem('pendingRoleSelection')
      if (pendingData) {
        try {
          const parsedData = JSON.parse(pendingData)
          // Check if data is recent (within 1 hour)
          if (Date.now() - parsedData.timestamp < 3600000) {
            setPendingUser(parsedData)
          } else {
            // Clear stale data
            localStorage.removeItem('pendingRoleSelection')
          }
        } catch (e) {
          console.error('Error parsing pending role selection data:', e)
          localStorage.removeItem('pendingRoleSelection')
        }
      }
    }
  }, [])

  const roles = [
    {
      id: 'customer',
      title: 'Fitness Enthusiast',
      description: 'Find and book amazing fitness classes',
      icon: Users,
      color: 'bg-blue-500',
      features: [
        'Book classes at any studio',
        'Use Thryve X Pass for flexible pricing',
        'Track your fitness journey',
        'Connect with instructors'
      ],
      dashboard: '/dashboard/customer'
    },
    {
      id: 'instructor',
      title: 'Fitness Instructor',
      description: 'Teach classes and manage your fitness career',
      icon: GraduationCap,
      color: 'bg-green-500',
      features: [
        'Create and manage your classes',
        'Track earnings and payouts',
        'Build your student community',
        'Access performance analytics'
      ],
      dashboard: '/dashboard/instructor',
      badge: 'Popular'
    },
    {
      id: 'merchant',
      title: 'Studio Owner',
      description: 'Manage your fitness studio and instructors',
      icon: Building,
      color: 'bg-purple-500',
      features: [
        'Manage studio operations',
        'Handle instructor payouts',
        'View business analytics',
        'Configure class pricing'
      ],
      dashboard: '/dashboard/merchant'
    }
  ]

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
  }

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue')
      return
    }

    setLoading(true)

    try {
      // Determine which user to use (authenticated user or pending signup)
      const targetUser = user || pendingUser
      
      if (!targetUser) {
        toast.error('No user found. Please sign in again.')
        window.location.href = '/'
        return
      }

      // Save role to backend
      await updateUserRole(targetUser, selectedRole.id)
      
      // Clear pending data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingRoleSelection')
      }
      
      // Refresh role in auth context if user is authenticated
      if (user) {
        await refreshRole()
      }
      
      toast.success(`Welcome! You're now set up as a ${selectedRole.title}`)
      
      // Redirect to appropriate dashboard
      setTimeout(() => {
        window.location.href = selectedRole.dashboard
      }, 1000)
      
    } catch (error) {
      console.error('Role selection error:', error)
      toast.error(error.message || 'Failed to set up your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Thryve</span>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you'll be using Thryve to get the best experience tailored for you
          </p>
          
          {/* Show user info if available */}
          {(user || pendingUser) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
              <p className="text-sm text-blue-800">
                Setting up account for: <span className="font-semibold">{user?.email || pendingUser?.email}</span>
              </p>
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole?.id === role.id
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg transform -translate-y-1' 
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`h-16 w-16 rounded-full ${role.color} flex items-center justify-center`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle className="h-6 w-6 text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="flex items-center justify-center gap-2">
                    {role.title}
                    {role.badge && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {role.badge}
                      </Badge>
                    )}
                  </CardTitle>
                  
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue as {selectedRole?.title || 'Selected Role'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          
          <p className="text-gray-500 mt-4">
            You can always change your role later in settings
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}