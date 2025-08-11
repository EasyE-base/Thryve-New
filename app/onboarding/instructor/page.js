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
import { User, Award, Calendar, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function InstructorOnboarding() {
  const { user, role, loading: authLoading, completeOnboarding: markOnboardingComplete } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const router = useRouter()
  
  const totalSteps = 5
  const stepLabels = ["Profile", "Credentials", "Teaching", "Verification", "Setup"]

  // ✅ FIXED: Separated state objects to prevent cross-contamination
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)

  // Separate state objects for each step
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePhoto: '',
    bio: ''
  })

  const [credentialsData, setCredentialsData] = useState({
    certifications: [],
    specialties: [],
    experience: '',
    education: '',
    languages: ['English']
  })

  const [teachingData, setTeachingData] = useState({
    availability: [],
    teachingStyle: '',
    maxClassSize: [10],
    ratePerHour: [50]
  })

  const [verificationData, setVerificationData] = useState({
    insurance: '',
    backgroundCheck: false,
    references: [],
    socialMedia: {
      instagram: '',
      youtube: '',
      website: ''
    }
  })

  const [setupData, setSetupData] = useState({
    taxId: '',
    paymentDetails: '',
    termsAccepted: false,
    liabilityWaiver: false
  })

  // ✅ FIXED: Proper validation with memoization
  const isProfileValid = useMemo(() => {
    return !!(profileData.firstName && profileData.lastName && profileData.bio)
  }, [profileData.firstName, profileData.lastName, profileData.bio])

  const isCredentialsValid = useMemo(() => {
    return !!(credentialsData.certifications.length > 0 && credentialsData.specialties.length > 0 && credentialsData.experience)
  }, [credentialsData.certifications, credentialsData.specialties, credentialsData.experience])

  const isTeachingValid = useMemo(() => {
    return !!(teachingData.availability.length > 0 && teachingData.teachingStyle)
  }, [teachingData.availability, teachingData.teachingStyle])

  const isVerificationValid = useMemo(() => {
    return !!(verificationData.insurance && verificationData.backgroundCheck)
  }, [verificationData.insurance, verificationData.backgroundCheck])

  const isSetupValid = useMemo(() => {
    return !!(setupData.termsAccepted && setupData.liabilityWaiver)
  }, [setupData.termsAccepted, setupData.liabilityWaiver])

  // ✅ FIXED: Validation logic using memoized values
  const canAdvanceStep = useMemo(() => {
    switch (currentStep) {
      case 1: return isProfileValid
      case 2: return isCredentialsValid
      case 3: return isTeachingValid
      case 4: return isVerificationValid
      case 5: return isSetupValid
      default: return false
    }
  }, [currentStep, isProfileValid, isCredentialsValid, isTeachingValid, isVerificationValid, isSetupValid])

  // ✅ FIXED: Safe state update functions
  const updateProfileData = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateCredentialsData = useCallback((field, value) => {
    setCredentialsData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateTeachingData = useCallback((field, value) => {
    setTeachingData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateVerificationData = useCallback((field, value) => {
    setVerificationData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateSetupData = useCallback((field, value) => {
    setSetupData(prev => ({ ...prev, [field]: value }))
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
    if (!canAdvanceStep || loading || !user) return

    setLoading(true)
    try {
      const allData = {
        profile: profileData,
        credentials: credentialsData,
        teaching: teachingData,
        verification: verificationData,
        setup: setupData
      }

      const sanitizeForFirestore = (value) => {
        if (Array.isArray(value)) {
          return value.map(sanitizeForFirestore).filter((v) => v !== undefined)
        }
        if (value && typeof value === 'object') {
          const out = {}
          Object.entries(value).forEach(([k, v]) => {
            const sv = sanitizeForFirestore(v)
            out[k] = sv === undefined ? null : sv
          })
          return out
        }
        return value === undefined ? null : value
      }

      // Save to users collection (avoid spreading user to prevent functions like getIdToken)
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email || '',
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        role: 'instructor',
        profileComplete: true,
        instructorData: sanitizeForFirestore(allData),
        updatedAt: new Date()
      }, { merge: true })

      // Save to instructors collection
      await setDoc(doc(db, 'instructors', user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: `${profileData.firstName} ${profileData.lastName}`,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        profilePhoto: profileData.profilePhoto,
        bio: profileData.bio,
        certifications: credentialsData.certifications,
        specialties: credentialsData.specialties,
        experience: credentialsData.experience,
        education: credentialsData.education,
        languages: credentialsData.languages,
        availability: teachingData.availability,
        teachingStyle: teachingData.teachingStyle,
        maxClassSize: teachingData.maxClassSize[0],
        ratePerHour: teachingData.ratePerHour[0],
        insurance: verificationData.insurance,
        backgroundCheck: verificationData.backgroundCheck,
        socialMedia: verificationData.socialMedia,
        taxId: setupData.taxId,
        paymentDetails: setupData.paymentDetails,
        termsAccepted: setupData.termsAccepted,
        liabilityWaiver: setupData.liabilityWaiver,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await completeOnboarding()
      await markOnboardingComplete()
      toast.success('Instructor profile completed successfully!')
      router.push('/dashboard/instructor')
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
      setProfileData(prev => ({ ...prev, ...formData.step1 }))
    }
  }, [user, role, authLoading, router, formData])

  // Options arrays
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
    'Early Morning (5-8 AM)',
    'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 
    'Evening (5-8 PM)', 'Night (8-10 PM)', 
    'Weekends', 'Holidays'
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

  const renderStepContent = () => {
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
                <Label htmlFor="profilePhoto">Profile Photo URL</Label>
                <Input
                  id="profilePhoto"
                  type="url"
                  value={profileData.profilePhoto}
                  onChange={(e) => updateProfileData('profilePhoto', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                placeholder="Tell us about your fitness journey and teaching philosophy..."
                rows={4}
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
              <p className="text-gray-600">Share your qualifications and areas of expertise</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Certifications *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certificationOptions.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={credentialsData.certifications.includes(cert)}
                        onCheckedChange={() => handleArrayToggle(setCredentialsData, 'certifications', cert)}
                      />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Specialties *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialtyOptions.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialty}
                        checked={credentialsData.specialties.includes(specialty)}
                        onCheckedChange={() => handleArrayToggle(setCredentialsData, 'specialties', specialty)}
                      />
                      <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select 
                    value={credentialsData.experience} 
                    onValueChange={(value) => updateCredentialsData('experience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                      <SelectItem value="1-2 years">1-2 years</SelectItem>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education Background</Label>
                  <Input
                    id="education"
                    value={credentialsData.education}
                    onChange={(e) => updateCredentialsData('education', e.target.value)}
                    placeholder="Degree, School, etc."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Languages Spoken</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languageOptions.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={credentialsData.languages.includes(language)}
                        onCheckedChange={() => handleArrayToggle(setCredentialsData, 'languages', language)}
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
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
              <p className="text-gray-600">When and how do you prefer to teach?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Availability *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availabilityOptions.map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={time}
                        checked={teachingData.availability.includes(time)}
                        onCheckedChange={() => handleArrayToggle(setTeachingData, 'availability', time)}
                      />
                      <Label htmlFor={time} className="text-sm">{time}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Teaching Style *</Label>
                <Select 
                  value={teachingData.teachingStyle} 
                  onValueChange={(value) => updateTeachingData('teachingStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your teaching style" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingStyleOptions.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Maximum Class Size: {teachingData.maxClassSize[0]} students</Label>
                <Slider
                  value={teachingData.maxClassSize}
                  onValueChange={(value) => updateTeachingData('maxClassSize', value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Hourly Rate: ${teachingData.ratePerHour[0]}</Label>
                <Slider
                  value={teachingData.ratePerHour}
                  onValueChange={(value) => updateTeachingData('ratePerHour', value)}
                  max={200}
                  min={20}
                  step={5}
                  className="w-full"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification & Professional Details</h2>
              <p className="text-gray-600">Complete your professional verification</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="insurance">Liability Insurance *</Label>
                <Select 
                  value={verificationData.insurance} 
                  onValueChange={(value) => updateVerificationData('insurance', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I have liability insurance">I have liability insurance</SelectItem>
                    <SelectItem value="I need help getting insurance">I need help getting insurance</SelectItem>
                    <SelectItem value="I'm covered under studio insurance">I'm covered under studio insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="backgroundCheck"
                  checked={verificationData.backgroundCheck}
                  onCheckedChange={(checked) => updateVerificationData('backgroundCheck', checked)}
                />
                <Label htmlFor="backgroundCheck">
                  I consent to a background check *
                </Label>
              </div>

              <div className="space-y-4">
                <Label>Social Media & Portfolio (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={verificationData.socialMedia.instagram}
                      onChange={(e) => updateVerificationData('socialMedia', {
                        ...verificationData.socialMedia,
                        instagram: e.target.value
                      })}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={verificationData.socialMedia.youtube}
                      onChange={(e) => updateVerificationData('socialMedia', {
                        ...verificationData.socialMedia,
                        youtube: e.target.value
                      })}
                      placeholder="Channel URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={verificationData.socialMedia.website}
                      onChange={(e) => updateVerificationData('socialMedia', {
                        ...verificationData.socialMedia,
                        website: e.target.value
                      })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Setup</h2>
              <p className="text-gray-600">Complete your instructor profile setup</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / SSN (Optional)</Label>
                  <Input
                    id="taxId"
                    value={setupData.taxId}
                    onChange={(e) => updateSetupData('taxId', e.target.value)}
                    placeholder="For payment processing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDetails">Payment Method</Label>
                  <Select 
                    value={setupData.paymentDetails} 
                    onValueChange={(value) => updateSetupData('paymentDetails', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Venmo">Venmo</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={setupData.termsAccepted}
                    onCheckedChange={(checked) => updateSetupData('termsAccepted', checked)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I accept the <a href="/terms" className="text-[#1E90FF] hover:underline">Terms of Service</a> *
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="liability"
                    checked={setupData.liabilityWaiver}
                    onCheckedChange={(checked) => updateSetupData('liabilityWaiver', checked)}
                  />
                  <Label htmlFor="liability" className="text-sm">
                    I accept the <a href="/liability" className="text-[#1E90FF] hover:underline">Liability Waiver</a> *
                  </Label>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Onboarding</h1>
            <p className="text-gray-600">Join our community of fitness professionals</p>
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
              completeLabel="Start Teaching"
            />
          </div>
        </div>
      </div>
    </div>
  )
}