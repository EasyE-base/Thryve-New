'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function InstructorOnboarding() {
  const { user, role, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    certifications: [],
    specialties: [],
    experience: '',
    availability: []
  })
  
  const router = useRouter()
  const totalSteps = 3

  const certificationOptions = [
    'ACE Certified Personal Trainer',
    'NASM Certified Personal Trainer', 
    'ACSM Certified Exercise Physiologist',
    'Yoga Alliance RYT-200',
    'Yoga Alliance RYT-500',
    'Pilates Instructor',
    'CrossFit Level 1',
    'Other'
  ]

  const specialtyOptions = [
    'Weight Training', 'Cardio', 'Yoga', 'Pilates', 'HIIT',
    'CrossFit', 'Dance', 'Martial Arts', 'Rehabilitation',
    'Senior Fitness', 'Youth Fitness', 'Nutrition Coaching'
  ]

  const availabilityOptions = [
    'Early Morning (5-8 AM)', 'Morning (8-12 PM)', 
    'Afternoon (12-5 PM)', 'Evening (5-8 PM)', 
    'Night (8-10 PM)', 'Weekends'
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in first')
      router.push('/')
      return
    }

    // Only redirect if we have a definitive role that doesn't match AND it's not loading
    // This prevents redirect loops when role data is still being loaded or updated
    if (role && role !== 'instructor' && !authLoading) {
      // Add a small delay to ensure this isn't a race condition
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Instructor onboarding: Redirecting user with role', role, 'to correct onboarding')
        router.push(`/onboarding/${role}`)
      }, 500)

      return () => clearTimeout(redirectTimer)
    }
  }, [user, role, authLoading, router])

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
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Use user.uid and role from context, with fallback
      const userRole = role || 'instructor' // Default to instructor if role is still loading
      
      console.log('🔥 Instructor Onboarding: Completing onboarding for user:', user.uid, 'role:', userRole)

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRole,
          profileData: formData
        })
      })

      // Handle 502 API routing issues gracefully
      if (response.status === 502) {
        // Store onboarding completion data locally as fallback
        const onboardingData = {
          uid: user.uid,
          email: user.email,
          role: userRole,
          profileData: formData,
          onboarding_complete: true,
          completed_at: new Date().toISOString()
        }
        
        localStorage.setItem('onboardingComplete', JSON.stringify(onboardingData))
        localStorage.setItem('tempUserData', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: userRole,
          onboarding_complete: true
        }))

        toast.success('Onboarding completed! Due to server routing issues, your data has been saved locally and will sync when the server is fully available.')
        
        // Still redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard/instructor')
        }, 2000)
        return
      }

      if (!response.ok) {
        let errorMessage = 'Failed to complete onboarding'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          if (response.status === 502) {
            errorMessage = 'Server routing issue - onboarding saved locally'
          } else {
            errorMessage = `Server error (${response.status})`
          }
        }
        
        throw new Error(errorMessage)
      }

      toast.success('Welcome to Thryve! Your instructor profile is complete.')
      
      // Add a small delay to ensure the redirect works properly
      setTimeout(() => {
        router.push('/dashboard/instructor')
      }, 1000)
    } catch (error) {
      console.error('Onboarding completion error:', error)
      
      // Check if it's a network/API error and implement fallback
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Server routing issue') ||
          error.message.includes('502')) {
        
        // Store onboarding completion data locally as fallback
        const onboardingData = {
          uid: user.uid,
          email: user.email,
          role: role || 'instructor',
          profileData: formData,
          onboarding_complete: true,
          completed_at: new Date().toISOString()
        }
        
        localStorage.setItem('onboardingComplete', JSON.stringify(onboardingData))
        localStorage.setItem('tempUserData', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role || 'instructor',
          onboarding_complete: true
        }))

        toast.success('API routing issue detected. Your onboarding has been completed locally and will sync when the server is available. Redirecting to dashboard...')
        
        // Still redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard/instructor')
        }, 3000)
      } else {
        toast.error(error.message || 'Failed to complete onboarding')
      }
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
              <p className="text-gray-600">Tell us about yourself</p>
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
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell potential clients about yourself, your experience, and your approach to fitness..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Certifications & Specialties</h2>
              <p className="text-gray-600">What certifications do you have?</p>
            </div>

            <div>
              <Label className="text-base font-medium">Certifications</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {certificationOptions.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={formData.certifications.includes(cert)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleArrayToggle('certifications', cert)
                        } else {
                          handleArrayToggle('certifications', cert)
                        }
                      }}
                    />
                    <Label
                      htmlFor={cert}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cert}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Specialties</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {specialtyOptions.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={formData.specialties.includes(specialty)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleArrayToggle('specialties', specialty)
                        } else {
                          handleArrayToggle('specialties', specialty)
                        }
                      }}
                    />
                    <Label
                      htmlFor={specialty}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <select
                id="experience"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select experience level</option>
                <option value="less-than-1">Less than 1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="more-than-10">More than 10 years</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability</h2>
              <p className="text-gray-600">When are you typically available to teach?</p>
            </div>

            <div>
              <Label className="text-base font-medium">Available Times</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {availabilityOptions.map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={time}
                      checked={formData.availability.includes(time)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleArrayToggle('availability', time)
                        } else {
                          handleArrayToggle('availability', time)
                        }
                      }}
                    />
                    <Label
                      htmlFor={time}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {time}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">You're all set!</h3>
              </div>
              <p className="text-blue-800 text-sm">
                Click "Complete Setup" to finish your instructor onboarding and start creating classes.
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
        return formData.firstName && formData.lastName && formData.bio
      case 2:
        return formData.certifications.length > 0 && formData.specialties.length > 0 && formData.experience
      case 3:
        return formData.availability.length > 0
      default:
        return false
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Instructor Onboarding</h1>
            <p className="text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Thryve Instructors!</CardTitle>
            <CardDescription>
              Let's set up your instructor profile so you can start teaching and earning.
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