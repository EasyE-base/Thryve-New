'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

export default function CustomerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    zipCode: '',
    interests: [],
    fitnessLevel: '',
    goals: []
  })
  
  const router = useRouter()
  const totalSteps = 3

  const fitnessInterests = [
    'Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Cardio',
    'Dance', 'Martial Arts', 'Swimming', 'Cycling', 'Running'
  ]

  const fitnessGoals = [
    'Weight Loss', 'Muscle Building', 'Flexibility', 'Endurance',
    'Stress Relief', 'General Fitness', 'Rehabilitation'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    if (loading) return

    setLoading(true)

    try {
      console.log('=== PROPER ONBOARDING COMPLETION ===')
      
      // Get current user and role from Supabase session
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        throw new Error('No active session found. Please refresh and try again.')
      }
      
      const userRole = session.user.user_metadata?.role
      console.log('User role from metadata:', userRole)
      
      if (!userRole) {
        throw new Error('Role not found. Please select your role again.')
      }
      
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole,
          profileData: formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete onboarding')
      }

      const data = await response.json()
      
      // Update Supabase user metadata to mark onboarding as complete
      await supabase.auth.updateUser({
        data: { 
          ...session.user.user_metadata,
          onboarding_complete: true 
        }
      })

      toast.success('Welcome to Thryve! Your profile is complete.')
      
      if (data.redirect) {
        router.push(data.redirect)
      } else {
        router.push(`/dashboard/${userRole}`)
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      toast.error(error.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Tell us a bit about yourself</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fitness Interests</h2>
              <p className="text-gray-600">What types of activities interest you?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fitnessInterests.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleArrayToggle('interests', interest)
                      } else {
                        handleArrayToggle('interests', interest)
                      }
                    }}
                  />
                  <Label
                    htmlFor={interest}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {interest}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fitnessLevel">Current Fitness Level</Label>
              <select
                id="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select your fitness level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fitness Goals</h2>
              <p className="text-gray-600">What are you hoping to achieve?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fitnessGoals.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={formData.goals.includes(goal)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleArrayToggle('goals', goal)
                      } else {
                        handleArrayToggle('goals', goal)
                      }
                    }}
                  />
                  <Label
                    htmlFor={goal}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {goal}
                  </Label>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">You're all set!</h3>
              </div>
              <p className="text-blue-800 text-sm">
                Click "Complete Setup" to finish your onboarding and start booking classes.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.zipCode
      case 2:
        return formData.interests.length > 0 && formData.fitnessLevel
      case 3:
        return formData.goals.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Customer Onboarding</h1>
            <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Thryve!</CardTitle>
            <CardDescription>
              Let's set up your profile so we can recommend the best classes for you.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={completeOnboarding}
                  disabled={!canProceed() || loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}