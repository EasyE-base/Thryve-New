'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboarding } from '@/hooks/useOnboarding'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import OnboardingSteps from '@/components/onboarding/OnboardingSteps'
import { User, Target, Calendar, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerOnboarding() {
  const { user, role, loading: authLoading, completeOnboarding: markOnboardingComplete } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const router = useRouter()
  
  const totalSteps = 4
  const stepLabels = ["Profile", "Goals", "Health", "Setup"]

  // ✅ FIXED: Separated state objects to prevent cross-contamination
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)

  // Separate state objects for each step
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    profilePhoto: ''
  })

  const [goalsData, setGoalsData] = useState({
    fitnessGoals: [],
    experienceLevel: '',
    preferredActivities: [],
    workoutFrequency: [2], // Times per week
    budgetRange: [50] // Monthly budget
  })

  const [healthData, setHealthData] = useState({
    medicalConditions: '',
    fitnessRestrictions: [],
    preferredTimes: [],
    preferredLocations: ''
  })

  const [setupData, setSetupData] = useState({
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

  // ✅ FIXED: Proper validation with memoization
  const isProfileValid = useMemo(() => {
    return !!(profileData.firstName && profileData.lastName && profileData.dateOfBirth)
  }, [profileData.firstName, profileData.lastName, profileData.dateOfBirth])

  const isGoalsValid = useMemo(() => {
    return !!(goalsData.fitnessGoals.length > 0 && goalsData.experienceLevel && goalsData.preferredActivities.length > 0)
  }, [goalsData.fitnessGoals, goalsData.experienceLevel, goalsData.preferredActivities])

  const isHealthValid = useMemo(() => {
    return !!(healthData.preferredTimes.length > 0)
  }, [healthData.preferredTimes])

  const isSetupValid = useMemo(() => {
    return !!(setupData.emergencyContact.name && setupData.emergencyContact.phone && setupData.paymentMethod)
  }, [setupData.emergencyContact.name, setupData.emergencyContact.phone, setupData.paymentMethod])

  // ✅ FIXED: Validation logic using memoized values
  const canAdvanceStep = useMemo(() => {
    switch (currentStep) {
      case 1: return isProfileValid
      case 2: return isGoalsValid
      case 3: return isHealthValid
      case 4: return isSetupValid
      default: return false
    }
  }, [currentStep, isProfileValid, isGoalsValid, isHealthValid, isSetupValid])

  // ✅ FIXED: Safe state update functions
  const updateProfileData = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateGoalsData = useCallback((field, value) => {
    setGoalsData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateHealthData = useCallback((field, value) => {
    setHealthData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateSetupData = useCallback((field, value) => {
    setSetupData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateEmergencyContact = useCallback((field, value) => {
    setSetupData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }))
  }, [])

  const updateNotifications = useCallback((field, value) => {
    setSetupData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }))
  }, [])

  // ✅ FIXED: Array toggle function for multi-select
  const handleArrayToggle = useCallback((setState, field, value) => {
    setState(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps && canAdvanceStep) {
      completeStep(currentStep)
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, canAdvanceStep, totalSteps, completeStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleComplete = async () => {
    if (!canAdvanceStep || loading) return

    setLoading(true)
    try {
      // Import Firebase functions dynamically
      const { doc, setDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Combine all form data
      const completeFormData = {
        // User profile data
        ...profileData,
        // Customer-specific data
        fitnessGoals: goalsData.fitnessGoals,
        experienceLevel: goalsData.experienceLevel,
        preferredActivities: goalsData.preferredActivities,
        workoutFrequency: goalsData.workoutFrequency[0],
        budgetRange: goalsData.budgetRange[0],
        medicalConditions: healthData.medicalConditions,
        fitnessRestrictions: healthData.fitnessRestrictions,
        preferredTimes: healthData.preferredTimes,
        preferredLocations: healthData.preferredLocations,
        emergencyContact: setupData.emergencyContact,
        paymentMethod: setupData.paymentMethod,
        notifications: setupData.notifications,
        // System fields
        role: 'customer',
        profileComplete: true,
        onboardingCompletedAt: new Date(),
        email: user.email,
        createdAt: new Date()
      }

      // Save to users collection
      await setDoc(doc(db, 'users', user.uid), completeFormData, { merge: true })

      // Create customer-specific profile
      await setDoc(doc(db, 'customers', user.uid), {
        name: `${profileData.firstName} ${profileData.lastName}`,
        goals: goalsData.fitnessGoals,
        preferences: goalsData.preferredActivities,
        experienceLevel: goalsData.experienceLevel,
        workoutFrequency: goalsData.workoutFrequency[0],
        budgetRange: goalsData.budgetRange[0],
        preferredTimes: healthData.preferredTimes,
        preferredLocations: healthData.preferredLocations,
        createdBy: user.uid,
        createdAt: new Date()
      })

      toast.success('Profile completed successfully!')
      
      // Use the OnboardingProvider's completeOnboarding function
      const result = await completeOnboarding(completeFormData)
      if (result.success) {
        // The OnboardingProvider will handle the redirect to dashboard
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Error completing onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
      setProfileData(prev => ({ ...prev, ...formData.step1 }))
    }
  }, [user, role, authLoading, router, formData])

  // Options arrays
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Tell us a bit about yourself</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => updateProfileData('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => updateProfileData('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => updateProfileData('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => updateProfileData('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo URL (Optional)</Label>
                <Input
                  id="profilePhoto"
                  type="url"
                  value={profileData.profilePhoto}
                  onChange={(e) => updateProfileData('profilePhoto', e.target.value)}
                  placeholder="https://..."
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fitness Goals & Preferences</h2>
              <p className="text-gray-600">Help us understand what you want to achieve</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Fitness Goals * (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {fitnessGoalsOptions.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={goalsData.fitnessGoals.includes(goal)}
                        onCheckedChange={() => handleArrayToggle(setGoalsData, 'fitnessGoals', goal)}
                      />
                      <Label htmlFor={goal} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select 
                  value={goalsData.experienceLevel} 
                  onValueChange={(value) => updateGoalsData('experienceLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your fitness experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner (New to fitness)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (Some experience)</SelectItem>
                    <SelectItem value="Advanced">Advanced (Regular fitness routine)</SelectItem>
                    <SelectItem value="Expert">Expert (Fitness enthusiast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Preferred Activities * (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activityOptions.map((activity) => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={activity}
                        checked={goalsData.preferredActivities.includes(activity)}
                        onCheckedChange={() => handleArrayToggle(setGoalsData, 'preferredActivities', activity)}
                      />
                      <Label htmlFor={activity} className="text-sm">{activity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Workout Frequency: {goalsData.workoutFrequency[0]} times per week</Label>
                <Slider
                  value={goalsData.workoutFrequency}
                  onValueChange={(value) => updateGoalsData('workoutFrequency', value)}
                  max={7}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Monthly Budget: ${goalsData.budgetRange[0]}</Label>
                <Slider
                  value={goalsData.budgetRange}
                  onValueChange={(value) => updateGoalsData('budgetRange', value)}
                  max={300}
                  min={25}
                  step={25}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Health & Preferences</h2>
              <p className="text-gray-600">Help us create a safe and personalized experience</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions or Concerns</Label>
                <Textarea
                  id="medicalConditions"
                  value={healthData.medicalConditions}
                  onChange={(e) => updateHealthData('medicalConditions', e.target.value)}
                  placeholder="Please list any medical conditions, injuries, or health concerns we should know about..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Fitness Restrictions (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {restrictionOptions.map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2">
                      <Checkbox
                        id={restriction}
                        checked={healthData.fitnessRestrictions.includes(restriction)}
                        onCheckedChange={() => handleArrayToggle(setHealthData, 'fitnessRestrictions', restriction)}
                      />
                      <Label htmlFor={restriction} className="text-sm">{restriction}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Workout Times * (Select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timePreferenceOptions.map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={time}
                        checked={healthData.preferredTimes.includes(time)}
                        onCheckedChange={() => handleArrayToggle(setHealthData, 'preferredTimes', time)}
                      />
                      <Label htmlFor={time} className="text-sm">{time}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocations">Preferred Locations/Areas</Label>
                <Input
                  id="preferredLocations"
                  value={healthData.preferredLocations}
                  onChange={(e) => updateHealthData('preferredLocations', e.target.value)}
                  placeholder="e.g., Downtown, Near home, Near work..."
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Setup</h2>
              <p className="text-gray-600">Complete your profile and start your fitness journey</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Emergency Contact Information *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Full Name</Label>
                    <Input
                      id="emergencyName"
                      value={setupData.emergencyContact.name}
                      onChange={(e) => updateEmergencyContact('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone Number</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={setupData.emergencyContact.phone}
                      onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Select 
                      value={setupData.emergencyContact.relationship} 
                      onValueChange={(value) => updateEmergencyContact('relationship', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select 
                  value={setupData.paymentMethod} 
                  onValueChange={(value) => updateSetupData('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Notification Preferences</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="classReminders"
                      checked={setupData.notifications.classReminders}
                      onCheckedChange={(checked) => updateNotifications('classReminders', checked)}
                    />
                    <Label htmlFor="classReminders" className="text-sm">
                      Class reminders and schedule updates
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="promotions"
                      checked={setupData.notifications.promotions}
                      onCheckedChange={(checked) => updateNotifications('promotions', checked)}
                    />
                    <Label htmlFor="promotions" className="text-sm">
                      Promotions and special offers
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="socialUpdates"
                      checked={setupData.notifications.socialUpdates}
                      onCheckedChange={(checked) => updateNotifications('socialUpdates', checked)}
                    />
                    <Label htmlFor="socialUpdates" className="text-sm">
                      Community updates and social features
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E90FF]/5 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Thryve</h1>
            <p className="text-gray-600">Let's personalize your fitness journey</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {stepLabels[currentStep - 1]}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#1E90FF] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {renderStepContent()}

            <OnboardingSteps
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrevious={prevStep}
              onComplete={handleComplete}
              canProceed={canAdvanceStep}
              loading={loading}
              completeLabel="Start My Journey"
            />
          </div>
        </div>
      </div>
    </div>
  )
}