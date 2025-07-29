'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import OnboardingSteps from '@/components/onboarding/OnboardingSteps'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { ArrowRight, ArrowLeft, CheckCircle, User, Award, Calendar, CreditCard, FileText, Camera, Zap, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function InstructorOnboarding() {
  const { user, role, loading: authLoading } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [stepData, setStepData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    phone: '',
    profilePhoto: '',
    bio: '',
    
    // Step 2: Certifications & Specialties
    certifications: [],
    specialties: [],
    experience: '',
    education: '',
    languages: ['English'],
    
    // Step 3: Availability & Teaching Preferences
    availability: [],
    teachingStyle: '',
    maxClassSize: [10],
    ratePerHour: [50],
    
    // Step 4: Verification & Professional Details
    insurance: '',
    backgroundCheck: false,
    references: [],
    socialMedia: {
      instagram: '',
      youtube: '',
      website: ''
    },
    
    // Step 5: Payment & Legal
    taxId: '',
    paymentDetails: '',
    termsAccepted: false,
    liabilityWaiver: false
  })
  
  const router = useRouter()
  const totalSteps = 5
  const stepLabels = ["Profile", "Credentials", "Teaching", "Verification", "Setup"]

  const certificationOptions = [
    'ACE Certified Personal Trainer',
    'NASM Certified Personal Trainer', 
    'ACSM Certified Exercise Physiologist',
    'Yoga Alliance RYT-200',
    'Yoga Alliance RYT-500',
    'Pilates Instructor',
    'CrossFit Level 1',
    'PADI Scuba Instructor',
    'Group Fitness Instructor',
    'Nutrition Coach Certification',
    'Other'
  ]

  const specialtyOptions = [
    'Weight Training', 'Cardio', 'Yoga', 'Pilates', 'HIIT',
    'CrossFit', 'Dance', 'Martial Arts', 'Rehabilitation',
    'Senior Fitness', 'Youth Fitness', 'Nutrition Coaching',
    'Prenatal Fitness', 'Injury Recovery', 'Sports Performance'
  ]

  const availabilityOptions = [
    'Early Morning (5-8 AM)', 'Morning (8-12 PM)', 
    'Afternoon (12-5 PM)', 'Evening (5-8 PM)', 
    'Night (8-10 PM)', 'Weekends', 'Holidays'
  ]

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic'
  ]

  const teachingStyleOptions = [
    'Encouraging & Supportive', 'High Energy & Motivational', 
    'Calm & Mindful', 'Technical & Detailed', 'Fun & Interactive',
    'Challenging & Intense', 'Beginner Friendly', 'Advanced Training'
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in first')
      router.push('/')
      return
    }

    if (role && role !== 'instructor' && !authLoading) {
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Instructor onboarding: Redirecting user with role', role, 'to correct onboarding')
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
        return stepData.firstName && stepData.lastName && stepData.phone && stepData.bio
      case 2:
        return stepData.certifications.length > 0 && stepData.specialties.length > 0 && stepData.experience
      case 3:
        return stepData.availability.length > 0 && stepData.teachingStyle
      case 4:
        return stepData.insurance
      case 5:
        return stepData.termsAccepted && stepData.liabilityWaiver
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
      toast.success('Welcome to Thryve! Your instructor profile is complete.')
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Tell us about yourself as a fitness professional</p>
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
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                value={stepData.bio}
                onChange={(e) => updateStepData('bio', e.target.value)}
                placeholder="Tell potential clients about yourself, your experience, and your approach to fitness..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Award className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Certifications & Specialties</h2>
              <p className="text-gray-600">What are your professional qualifications?</p>
            </div>

            <div>
              <Label className="text-base font-medium">Certifications *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {certificationOptions.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={stepData.certifications.includes(cert)}
                      onCheckedChange={() => handleArrayToggle('certifications', cert)}
                    />
                    <Label htmlFor={cert} className="text-sm">
                      {cert}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Specialties *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {specialtyOptions.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={stepData.specialties.includes(specialty)}
                      onCheckedChange={() => handleArrayToggle('specialties', specialty)}
                    />
                    <Label htmlFor={specialty} className="text-sm">
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <select
                  id="experience"
                  value={stepData.experience}
                  onChange={(e) => updateStepData('experience', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Select experience level</option>
                  <option value="less-than-1">Less than 1 year</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="more-than-10">More than 10 years</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education Background</Label>
                <Input
                  id="education"
                  value={stepData.education}
                  onChange={(e) => updateStepData('education', e.target.value)}
                  placeholder="Degree in Exercise Science, Kinesiology, etc."
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Languages Spoken</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {languageOptions.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={stepData.languages.includes(language)}
                      onCheckedChange={() => handleArrayToggle('languages', language)}
                    />
                    <Label htmlFor={language} className="text-sm">
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Teaching Preferences</h2>
              <p className="text-gray-600">When and how do you like to teach?</p>
            </div>

            <div>
              <Label className="text-base font-medium">Available Times *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {availabilityOptions.map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={time}
                      checked={stepData.availability.includes(time)}
                      onCheckedChange={() => handleArrayToggle('availability', time)}
                    />
                    <Label htmlFor={time} className="text-sm">
                      {time}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teachingStyle">Teaching Style *</Label>
              <select
                id="teachingStyle"
                value={stepData.teachingStyle}
                onChange={(e) => updateStepData('teachingStyle', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select your teaching style</option>
                {teachingStyleOptions.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">Preferred Max Class Size</Label>
                <div className="mt-3">
                  <Slider
                    value={stepData.maxClassSize}
                    onValueChange={(value) => updateStepData('maxClassSize', value)}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-medium text-[#1E90FF]">
                      {stepData.maxClassSize[0]} students
                    </span>
                    <span>50+</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Hourly Rate</Label>
                <div className="mt-3">
                  <Slider
                    value={stepData.ratePerHour}
                    onValueChange={(value) => updateStepData('ratePerHour', value)}
                    max={200}
                    min={25}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>$25</span>
                    <span className="font-medium text-[#1E90FF]">
                      ${stepData.ratePerHour[0]}/hour
                    </span>
                    <span>$200+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification & Professional Details</h2>
              <p className="text-gray-600">Help us verify your professional credentials</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance">Professional Liability Insurance *</Label>
              <select
                id="insurance"
                value={stepData.insurance}
                onChange={(e) => updateStepData('insurance', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select insurance status</option>
                <option value="current">I have current liability insurance</option>
                <option value="obtaining">I am in the process of obtaining insurance</option>
                <option value="none">I do not have insurance</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="backgroundCheck"
                checked={stepData.backgroundCheck}
                onCheckedChange={(checked) => updateStepData('backgroundCheck', checked)}
              />
              <Label htmlFor="backgroundCheck" className="text-sm">
                I consent to a background check (required for certain class types)
              </Label>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Social Media & Professional Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={stepData.socialMedia.instagram}
                    onChange={(e) => updateNestedData('socialMedia', 'instagram', e.target.value)}
                    placeholder="@yourusername"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={stepData.socialMedia.youtube}
                    onChange={(e) => updateNestedData('socialMedia', 'youtube', e.target.value)}
                    placeholder="Channel URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Personal Website</Label>
                  <Input
                    id="website"
                    value={stepData.socialMedia.website}
                    onChange={(e) => updateNestedData('socialMedia', 'website', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Setup</h2>
              <p className="text-gray-600">Just a few more details to get you started</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN (Optional)</Label>
              <Input
                id="taxId"
                value={stepData.taxId}
                onChange={(e) => updateStepData('taxId', e.target.value)}
                placeholder="For tax reporting purposes"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={stepData.termsAccepted}
                  onCheckedChange={(checked) => updateStepData('termsAccepted', checked)}
                />
                <Label htmlFor="termsAccepted" className="text-sm">
                  I agree to the Terms of Service and Instructor Agreement *
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="liabilityWaiver"
                  checked={stepData.liabilityWaiver}
                  onCheckedChange={(checked) => updateStepData('liabilityWaiver', checked)}
                />
                <Label htmlFor="liabilityWaiver" className="text-sm">
                  I understand and accept liability waivers and safety requirements *
                </Label>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Ready to Inspire!</h3>
              </div>
              <p className="text-green-800 text-sm">
                Complete your setup to start teaching, earning, and building your fitness community on Thryve.
              </p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Thryve Instructors! 💪</h1>
          <p className="text-xl text-gray-600 mb-6">Let's set up your professional instructor profile</p>
          
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
            <CardTitle className="text-2xl">Instructor Onboarding</CardTitle>
            <CardDescription className="text-lg">
              Step {currentStep} of {totalSteps}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {renderStep()}

            {/* Navigation Buttons */}
            <OnboardingSteps
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrevious={prevStep}
              onComplete={handleComplete}
              canProceed={isStepValid()}
              loading={loading}
              completeLabel="Complete Instructor Setup"
            />
          </CardContent>
        </Card>
      </div>

      {/* Welcome Tour */}
      <WelcomeTour
        isOpen={showWelcomeTour}
        onClose={() => setShowWelcomeTour(false)}
        userRole="instructor"
      />
    </div>
  )
}