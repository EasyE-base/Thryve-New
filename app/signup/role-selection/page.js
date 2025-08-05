'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { User, Users, Building2 } from 'lucide-react'

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'I want to book classes and track my fitness journey',
      icon: User,
      color: 'bg-blue-500',
      features: ['Book classes', 'Track progress', 'View schedules', 'Rate instructors']
    },
    {
      id: 'instructor',
      title: 'Instructor',
      description: 'I teach classes and want to manage my schedule',
      icon: Users,
      color: 'bg-green-500',
      features: ['Create classes', 'Manage schedule', 'Track earnings', 'View bookings']
    },
    {
      id: 'merchant',
      title: 'Studio Owner',
      description: 'I own a fitness studio and want to manage everything',
      icon: Building2,
      color: 'bg-purple-500',
      features: ['Manage studio', 'Hire instructors', 'View analytics', 'Process payments']
    }
  ]

  const handleRoleSelect = async (role) => {
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/signup')
      return
    }

    setSelectedRole(role)
    setLoading(true)

    try {
      // Update user role in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        role: role.id,
        updatedAt: new Date()
      })

      toast.success(`Role set to ${role.title}!`)
      
      // Redirect based on role
      const redirectPaths = {
        customer: '/profile/customer',
        instructor: '/profile/instructor',
        merchant: '/profile/studio'
      }
      
      router.push(redirectPaths[role.id])
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to set role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Role
          </h1>
          <p className="text-lg text-gray-600">
            Tell us how you'll be using Thryve
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedRole?.id === role.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Setting up your account...</p>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            You can change your role later in your profile settings
          </p>
        </div>
      </div>
    </div>
  )
}
