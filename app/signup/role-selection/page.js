'use client'

import { useState } from 'react'
import { handleRoleSelection } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Dumbbell, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function RoleSelection() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const router = useRouter()

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: Users,
      description: 'Book fitness classes and track your progress',
      features: [
        'Browse and book classes',
        'Track your fitness journey',
        'Connect with instructors',
        'Manage your schedule'
      ]
    },
    {
      id: 'instructor',
      title: 'Instructor',
      icon: Dumbbell,
      description: 'Teach classes and earn money doing what you love',
      features: [
        'Create and manage classes',
        'Set your own schedule',
        'Earn money from bookings',
        'Build your client base'
      ]
    },
    {
      id: 'merchant',
      title: 'Studio Owner',
      icon: Building2,
      description: 'Manage your studio and grow your fitness business',
      features: [
        'Manage multiple locations',
        'Oversee staff and instructors',
        'Track business analytics',
        'Handle payments and bookings'
      ]
    }
  ]

  const selectRole = async (role) => {
    if (loading) return

    setLoading(true)
    setSelectedRole(role)

    try {
      await handleRoleSelection(role)
      toast.success(`Role selected: ${roles.find(r => r.id === role)?.title}`)
      router.push(`/onboarding/${role}`)
    } catch (error) {
      toast.error(error.message || 'Failed to select role')
      setSelectedRole(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose Your Role
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Select how you'd like to use Thryve to get started
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            const isLoading = loading && isSelected

            return (
              <Card
                key={role.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                }`}
                onClick={() => selectRole(role.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    disabled={loading}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Selecting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Choose {role.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Don't worry, you can always change your role later in your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}