'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import StepIndicator from '@/components/onboarding/StepIndicator'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import { ArrowRight, ArrowLeft, CheckCircle, Camera, CreditCard, User, Heart, Target, Calendar, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerOnboarding() {
  const { user, role, loading: authLoading } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [stepData, setStepData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    profilePhoto: '',
    
    // Step 2: Fitness Goals & Preferences  
    fitnessGoals: [],
    experienceLevel: '',
    preferredActivities: [],
    workoutFrequency: [2], // Times per week
    budgetRange: [50], // Monthly budget
    
    // Step 3: Health & Preferences
    medicalConditions: '',
    fitnessRestrictions: [],
    preferredTimes: [],
    preferredLocations: '',
    
    // Step 4: Emergency Contact & Payment
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    paymentMethod: '',
    notifications: {
      classReminders: true,
      promotions: false,
      socialUpdates: true
    }
  })
  
  const router = useRouter()
  const totalSteps = 4
  
  const stepLabels = ["Profile", "Goals", "Health", "Setup"]
  
  const fitnessGoalsOptions = [
    'Weight Loss', 'Muscle Building', 'Cardiovascular Health', 'Flexibility', 
    'Strength Training', 'Stress Relief', 'Athletic Performance', 'General Fitness',
    'Injury Recovery', 'Mental Health'
  ]
  
  const activityOptions = [
    'Yoga', 'Pilates', 'HIIT', 'Weightlifting', 'Cardio', 'Dance', 
    'Martial Arts', 'Swimming', 'Running', 'Boxing', 'CrossFit', 
    'Cycling', 'Rock Climbing', 'Stretching'
  ]
  
  const restrictionOptions = [
    'Back Problems', 'Knee Issues', 'Shoulder Injury', 'Heart Condition',
    'High Blood Pressure', 'Pregnancy', 'Recent Surgery', 'Arthritis'
  ]
  
  const timePreferenceOptions = [
    'Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 
    'Evening (5-8 PM)', 'Night (8-10 PM)', 'Weekends Only'
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in first')
      router.push('/')
      return
    }

    if (role && role !== 'customer' && !authLoading) {
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Customer onboarding: Redirecting user with role', role, 'to correct onboarding')
        router.push(`/onboarding/${role}`)
      }, 500)

      return () => clearTimeout(redirectTimer)
    }

    // Check if this is first time user
    const hasSeenTour = localStorage.getItem(`tour_seen_${user?.uid}`)
    if (!hasSeenTour && user) {
      setShowWelcomeTour(true)
    }
    
    // Load saved data
    if (formData.step1) {
      setStepData(prev => ({ ...prev, ...formData.step1 }))
    }
  }, [user, role, authLoading, router, formData])

  const updateStepData = (field, value) => {
    setStepData(prev => {
      const newData = { ...prev, [field]: value }
      updateFormData(newData, currentStep)
      return newData
    })
  }

  const updateNestedData = (parent, field, value) => {
    setStepData(prev => {
      const newData = {
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      }
      updateFormData(newData, currentStep)
      return newData
    })
  }

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid()) {
      completeStep(currentStep)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return stepData.firstName && stepData.lastName && stepData.phone
      case 2:
        return stepData.fitnessGoals.length > 0 && stepData.experienceLevel && stepData.preferredActivities.length > 0
      case 3:
        return stepData.preferredTimes.length > 0
      case 4:
        return stepData.emergencyContact.name && stepData.emergencyContact.phone && stepData.emergencyContact.relationship
      default:
        return false
    }
  }

  const handleArrayToggle = (field, value) => {
    const current = stepData[field] || []
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    updateStepData(field, updated)
  }

  const handleComplete = async () => {
    if (!isStepValid() || loading) return

    setLoading(true)
    try {
      await completeOnboarding(stepData)
      setShowWelcomeTour(true)
      localStorage.setItem(`tour_seen_${user.uid}`, 'true')
      toast.success('Welcome to Thryve! Your profile is complete.')
    } catch (error) {
      console.error('Onboarding completion error:', error)
      toast.error('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's Get to Know You</h2>
              <p className="text-gray-600">Tell us about yourself to personalize your experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={stepData.firstName}
                  onChange={(e) => updateStepData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={stepData.lastName}
                  onChange={(e) => updateStepData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={stepData.phone}
                  onChange={(e) => updateStepData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={stepData.dateOfBirth}
                  onChange={(e) => updateStepData('dateOfBirth', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Fitness Goals</h2>
              <p className="text-gray-600">Help us tailor the perfect fitness experience for you</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">What are your main fitness goals? *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {fitnessGoalsOptions.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={stepData.fitnessGoals.includes(goal)}
                        onCheckedChange={() => handleArrayToggle('fitnessGoals', goal)}
                      />
                      <Label htmlFor={goal} className="text-sm">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <select
                  id="experienceLevel"
                  value={stepData.experienceLevel}
                  onChange={(e) => updateStepData('experienceLevel', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner - New to fitness</option>
                  <option value="intermediate">Intermediate - Some experience</option>
                  <option value="advanced">Advanced - Very experienced</option>
                </select>
              </div>

              <div>
                <Label className="text-base font-medium">Preferred Activities *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {activityOptions.map((activity) => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={activity}
                        checked={stepData.preferredActivities.includes(activity)}
                        onCheckedChange={() => handleArrayToggle('preferredActivities', activity)}
                      />
                      <Label htmlFor={activity} className="text-sm">
                        {activity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">Workout Frequency (per week)</Label>
                  <div className="mt-3">
                    <Slider
                      value={stepData.workoutFrequency}
                      onValueChange={(value) => updateStepData('workoutFrequency', value)}
                      max={7}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>1x</span>
                      <span className="font-medium text-[#1E90FF]">
                        {stepData.workoutFrequency[0]}x per week
                      </span>
                      <span>7x</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Monthly Budget</Label>
                  <div className="mt-3">
                    <Slider
                      value={stepData.budgetRange}
                      onValueChange={(value) => updateStepData('budgetRange', value)}
                      max={300}
                      min={20}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>$20</span>
                      <span className="font-medium text-[#1E90FF]">
                        ${stepData.budgetRange[0]}/month
                      </span>
                      <span>$300+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Health & Preferences</h2>
              <p className="text-gray-600">Help us keep you safe and comfortable</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="medicalConditions">Medical Conditions (Optional)</Label>
                <Textarea
                  id="medicalConditions"
                  value={stepData.medicalConditions}
                  onChange={(e) => updateStepData('medicalConditions', e.target.value)}
                  placeholder="Any medical conditions, allergies, or medications we should know about..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Any fitness restrictions?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {restrictionOptions.map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2">
                      <Checkbox
                        id={restriction}
                        checked={stepData.fitnessRestrictions.includes(restriction)}
                        onCheckedChange={() => handleArrayToggle('fitnessRestrictions', restriction)}
                      />
                      <Label htmlFor={restriction} className="text-sm">
                        {restriction}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Preferred Workout Times *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {timePreferenceOptions.map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={time}
                        checked={stepData.preferredTimes.includes(time)}
                        onCheckedChange={() => handleArrayToggle('preferredTimes', time)}
                      />
                      <Label htmlFor={time} className="text-sm">
                        {time}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="preferredLocations">Preferred Areas/Neighborhoods</Label>
                <Input
                  id="preferredLocations"
                  value={stepData.preferredLocations}
                  onChange={(e) => updateStepData('preferredLocations', e.target.value)}
                  placeholder="e.g., Downtown, Midtown, Brooklyn Heights..."
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost Done!</h2>
              <p className="text-gray-600">Just a few final details to get you started</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Emergency Contact *</Label>
                <div className="grid gap-4 mt-3">
                  <div>
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={stepData.emergencyContact.name}
                      onChange={(e) => updateNestedData('emergencyContact', 'name', e.target.value)}
                      placeholder="Emergency contact full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyPhone">Phone Number</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={stepData.emergencyContact.phone}
                        onChange={(e) => updateNestedData('emergencyContact', 'phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyRelationship">Relationship</Label>
                      <Input
                        id="emergencyRelationship"
                        value={stepData.emergencyContact.relationship}
                        onChange={(e) => updateNestedData('emergencyContact', 'relationship', e.target.value)}
                        placeholder="e.g., Spouse, Parent, Friend"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Notification Preferences</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="classReminders"
                      checked={stepData.notifications.classReminders}
                      onCheckedChange={(checked) => 
                        updateStepData('notifications', { ...stepData.notifications, classReminders: checked })
                      }
                    />
                    <Label htmlFor="classReminders" className="text-sm">
                      Class reminders and updates
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="promotions"
                      checked={stepData.notifications.promotions}
                      onCheckedChange={(checked) => 
                        updateStepData('notifications', { ...stepData.notifications, promotions: checked })
                      }
                    />
                    <Label htmlFor="promotions" className="text-sm">
                      Promotions and special offers
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="socialUpdates"
                      checked={stepData.notifications.socialUpdates}
                      onCheckedChange={(checked) => 
                        updateStepData('notifications', { ...stepData.notifications, socialUpdates: checked })
                      }
                    />
                    <Label htmlFor="socialUpdates" className="text-sm">
                      Community and social updates
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-900">You're Ready to Start!</h3>
                </div>
                <p className="text-green-800 text-sm">
                  Complete your profile to start discovering amazing fitness classes and connecting with the community.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Thryve! 🎉</h1>
          <p className="text-xl text-gray-600 mb-6">Let's create your personalized fitness profile</p>
          
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            completedSteps={onboardingStatus.completedSteps}
            stepLabels={stepLabels}
            className="mb-8"
          />
        </div>

        {/* Main Form */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Customer Onboarding</CardTitle>
            <CardDescription className="text-lg">
              Step {currentStep} of {totalSteps}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] hover:from-[#1976D2] hover:to-[#1976D2] text-white"
                  size="lg"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading || !isStepValid()}
                  className="flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Complete Setup
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Tour */}
      <WelcomeTour
        isOpen={showWelcomeTour}
        onClose={() => setShowWelcomeTour(false)}
        userRole="customer"
      />
    </div>
  )
}