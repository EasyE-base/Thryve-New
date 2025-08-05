'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { ArrowRight, ArrowLeft, CheckCircle, User, Building, MapPin, CreditCard, Settings, Camera, Zap, DollarSign, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function MerchantOnboarding() {
  const { user, role, loading: authLoading, completeOnboarding: markOnboardingComplete } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const router = useRouter()
  
  const totalSteps = 6
  const stepLabels = ["Profile", "Location", "Operations", "Staff", "Pricing", "Setup"]

  // ✅ FIXED: Separated state objects to prevent cross-contamination
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)

  // Separate state objects for each step
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessEmail: ''
  })

  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    amenities: [],
    capacity: [50]
  })

  const [operationsData, setOperationsData] = useState({
    operatingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '07:00', close: '20:00' },
      sunday: { open: '08:00', close: '18:00' }
    },
    cancellationPolicy: '24-hour',
    noShowFee: [15],
    lateCancelFee: [10]
  })

  const [staffData, setStaffData] = useState({
    staffCount: [5],
    instructorRequirements: [],
    managementStyle: '',
    hiringPlans: ''
  })

  const [pricingData, setPricingData] = useState({
    membershipTypes: [],
    pricingModel: '',
    specialFeatures: [],
    marketingPreferences: []
  })

  const [setupData, setSetupData] = useState({
    businessLicense: '',
    insurance: '',
    taxId: '',
    bankingDetails: '',
    termsAccepted: false,
    privacyAccepted: false
  })

  // ✅ FIXED: Proper validation with memoization
  const isProfileValid = useMemo(() => {
    return !!(profileData.firstName && profileData.lastName && profileData.businessName && profileData.businessType)
  }, [profileData.firstName, profileData.lastName, profileData.businessName, profileData.businessType])

  const isLocationValid = useMemo(() => {
    return !!(locationData.address && locationData.city && locationData.state && locationData.zipCode)
  }, [locationData.address, locationData.city, locationData.state, locationData.zipCode])

  const isOperationsValid = useMemo(() => {
    return !!(operationsData.cancellationPolicy)
  }, [operationsData.cancellationPolicy])

  const isStaffValid = useMemo(() => {
    return !!(staffData.managementStyle)
  }, [staffData.managementStyle])

  const isPricingValid = useMemo(() => {
    return !!(pricingData.pricingModel && pricingData.membershipTypes.length > 0)
  }, [pricingData.pricingModel, pricingData.membershipTypes.length])

  const isSetupValid = useMemo(() => {
    return !!(setupData.termsAccepted && setupData.privacyAccepted)
  }, [setupData.termsAccepted, setupData.privacyAccepted])

  // ✅ FIXED: Consolidated validation logic
  const canAdvanceStep = useMemo(() => {
    switch (currentStep) {
      case 1: return isProfileValid
      case 2: return isLocationValid
      case 3: return isOperationsValid
      case 4: return isStaffValid
      case 5: return isPricingValid
      case 6: return isSetupValid
      default: return false
    }
  }, [currentStep, isProfileValid, isLocationValid, isOperationsValid, isStaffValid, isPricingValid, isSetupValid])

  // ✅ FIXED: Safe state update functions
  const updateProfileData = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateLocationData = useCallback((field, value) => {
    setLocationData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateOperationsData = useCallback((field, value) => {
    setOperationsData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateStaffData = useCallback((field, value) => {
    setStaffData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updatePricingData = useCallback((field, value) => {
    setPricingData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateSetupData = useCallback((field, value) => {
    setSetupData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ✅ FIXED: Proper array handling for amenities, requirements, etc.
  const handleArrayToggle = useCallback((field, value, stepType) => {
    const updateFunction = {
      'location': updateLocationData,
      'staff': updateStaffData,
      'pricing': updatePricingData
    }[stepType]

    if (updateFunction) {
      updateFunction(field, prev => {
        const currentArray = stepType === 'location' ? locationData[field] : 
                           stepType === 'staff' ? staffData[field] : 
                           pricingData[field]
        
        if (currentArray.includes(value)) {
          return currentArray.filter(item => item !== value)
        } else {
          return [...currentArray, value]
        }
      })
    }
  }, [updateLocationData, updateStaffData, updatePricingData, locationData, staffData, pricingData])

  // Authentication check
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/login')
      return
    }

    if (role && role !== 'merchant') {
      toast.error('Access denied. Studio owner account required.')
      router.push('/')
      return
    }
  }, [user, role, authLoading, router])

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, totalSteps])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!canAdvanceStep) return

    setLoading(true)

    try {
      // Combine all step data for submission
      const completeFormData = {
        ...profileData,
        ...locationData,
        ...operationsData,
        ...staffData,
        ...pricingData,
        ...setupData,
        role: 'merchant'
      }

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(completeFormData)
      })

      if (response.ok) {
        await completeOnboarding()
        await markOnboardingComplete()
        toast.success('Onboarding completed successfully!')
        router.push('/dashboard/merchant')
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding submission error:', error)
      toast.error('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [canAdvanceStep, profileData, locationData, operationsData, staffData, pricingData, setupData, user, completeOnboarding, router])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Profile & Business Info</h2>
              <p className="text-gray-600">Tell us about yourself and your studio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => updateProfileData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => updateProfileData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => updateProfileData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={profileData.businessEmail}
                  onChange={(e) => updateProfileData('businessEmail', e.target.value)}
                  placeholder="studio@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Studio Name *</Label>
                <Input
                  id="businessName"
                  value={profileData.businessName}
                  onChange={(e) => updateProfileData('businessName', e.target.value)}
                  placeholder="Your Studio Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Studio Type *</Label>
                <select
                  id="businessType"
                  value={profileData.businessType}
                  onChange={(e) => updateProfileData('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                >
                  <option value="">Select studio type</option>
                  <option value="yoga">Yoga Studio</option>
                  <option value="pilates">Pilates Studio</option>
                  <option value="crossfit">CrossFit Box</option>
                  <option value="dance">Dance Studio</option>
                  <option value="martial-arts">Martial Arts</option>
                  <option value="general-fitness">General Fitness</option>
                  <option value="specialized">Specialized Training</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Location & Studio Details</h2>
              <p className="text-gray-600">Where is your studio located?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Studio Address *</Label>
                <Input
                  id="address"
                  value={locationData.address}
                  onChange={(e) => updateLocationData('address', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={locationData.city}
                    onChange={(e) => updateLocationData('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={locationData.state}
                    onChange={(e) => updateLocationData('state', e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={locationData.zipCode}
                    onChange={(e) => updateLocationData('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Studio Description</Label>
                <Textarea
                  id="description"
                  value={locationData.description}
                  onChange={(e) => updateLocationData('description', e.target.value)}
                  placeholder="Describe your studio's atmosphere, mission, and what makes it special..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Amenities & Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Parking Available', 'Showers', 'Lockers', 'Retail Shop',
                    'Childcare', 'WiFi', 'Sound System', 'Air Conditioning',
                    'Yoga Props', 'Free Weights', 'Cardio Equipment'
                  ].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={locationData.amenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateLocationData('amenities', [...locationData.amenities, amenity])
                          } else {
                            updateLocationData('amenities', locationData.amenities.filter(a => a !== amenity))
                          }
                        }}
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="capacity">Studio Capacity: {locationData.capacity[0]} people</Label>
                <Slider
                  id="capacity"
                  min={10}
                  max={200}
                  step={5}
                  value={locationData.capacity}
                  onValueChange={(value) => updateLocationData('capacity', value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Operations & Policies</h2>
              <p className="text-gray-600">Set your operating hours and policies</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Operating Hours</Label>
                {Object.entries(operationsData.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24 capitalize font-medium">{day}</div>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateOperationsData('operatingHours', {
                        ...operationsData.operatingHours,
                        [day]: { ...hours, open: e.target.value }
                      })}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateOperationsData('operatingHours', {
                        ...operationsData.operatingHours,
                        [day]: { ...hours, close: e.target.value }
                      })}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label htmlFor="cancellationPolicy">Cancellation Policy *</Label>
                <select
                  id="cancellationPolicy"
                  value={operationsData.cancellationPolicy}
                  onChange={(e) => updateOperationsData('cancellationPolicy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                >
                  <option value="">Select policy</option>
                  <option value="2-hour">2 Hours Before</option>
                  <option value="4-hour">4 Hours Before</option>
                  <option value="24-hour">24 Hours Before</option>
                  <option value="48-hour">48 Hours Before</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>No-Show Fee: ${operationsData.noShowFee[0]}</Label>
                  <Slider
                    min={0}
                    max={50}
                    step={5}
                    value={operationsData.noShowFee}
                    onValueChange={(value) => updateOperationsData('noShowFee', value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Late Cancel Fee: ${operationsData.lateCancelFee[0]}</Label>
                  <Slider
                    min={0}
                    max={30}
                    step={5}
                    value={operationsData.lateCancelFee}
                    onValueChange={(value) => updateOperationsData('lateCancelFee', value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Staff & Management</h2>
              <p className="text-gray-600">Tell us about your team and hiring plans</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Current Staff Count: {staffData.staffCount[0]} people</Label>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={staffData.staffCount}
                  onValueChange={(value) => updateStaffData('staffCount', value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Instructor Requirements</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Certified Training', 'CPR Certification', 'Insurance Required',
                    'Background Check', 'Teaching Experience', 'Continuing Education'
                  ].map((requirement) => (
                    <div key={requirement} className="flex items-center space-x-2">
                      <Checkbox
                        id={requirement}
                        checked={staffData.instructorRequirements.includes(requirement)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateStaffData('instructorRequirements', [...staffData.instructorRequirements, requirement])
                          } else {
                            updateStaffData('instructorRequirements', staffData.instructorRequirements.filter(r => r !== requirement))
                          }
                        }}
                      />
                      <Label htmlFor={requirement} className="text-sm">{requirement}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managementStyle">Management Style *</Label>
                <select
                  id="managementStyle"
                  value={staffData.managementStyle}
                  onChange={(e) => updateStaffData('managementStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                >
                  <option value="">Select management style</option>
                  <option value="hands-on">Hands-On Management</option>
                  <option value="collaborative">Collaborative Leadership</option>
                  <option value="delegative">Delegative Approach</option>
                  <option value="supportive">Supportive Management</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiringPlans">Hiring Plans</Label>
                <Textarea
                  id="hiringPlans"
                  value={staffData.hiringPlans}
                  onChange={(e) => updateStaffData('hiringPlans', e.target.value)}
                  placeholder="Describe your plans for hiring instructors and staff..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Pricing & Features</h2>
              <p className="text-gray-600">Set up your pricing and membership options</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Membership Types *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Drop-in Classes', 'Class Packages', 'Monthly Unlimited',
                    'Annual Memberships', 'Student Discounts', 'Senior Discounts'
                  ].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={pricingData.membershipTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updatePricingData('membershipTypes', [...pricingData.membershipTypes, type])
                          } else {
                            updatePricingData('membershipTypes', pricingData.membershipTypes.filter(t => t !== type))
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingModel">Pricing Model *</Label>
                <select
                  id="pricingModel"
                  value={pricingData.pricingModel}
                  onChange={(e) => updatePricingData('pricingModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                >
                  <option value="">Select pricing model</option>
                  <option value="premium">Premium Pricing</option>
                  <option value="competitive">Competitive Pricing</option>
                  <option value="value">Value Pricing</option>
                  <option value="tiered">Tiered Pricing</option>
                </select>
              </div>

              <div className="space-y-4">
                <Label>Special Features</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Online Classes', 'Personal Training', 'Workshops',
                    'Retreats', 'Corporate Programs', 'Teacher Training'
                  ].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={pricingData.specialFeatures.includes(feature)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updatePricingData('specialFeatures', [...pricingData.specialFeatures, feature])
                          } else {
                            updatePricingData('specialFeatures', pricingData.specialFeatures.filter(f => f !== feature))
                          }
                        }}
                      />
                      <Label htmlFor={feature} className="text-sm">{feature}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Marketing Preferences</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Social Media', 'Email Marketing', 'Local Partnerships',
                    'Referral Programs', 'Community Events', 'Online Advertising'
                  ].map((preference) => (
                    <div key={preference} className="flex items-center space-x-2">
                      <Checkbox
                        id={preference}
                        checked={pricingData.marketingPreferences.includes(preference)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updatePricingData('marketingPreferences', [...pricingData.marketingPreferences, preference])
                          } else {
                            updatePricingData('marketingPreferences', pricingData.marketingPreferences.filter(p => p !== preference))
                          }
                        }}
                      />
                      <Label htmlFor={preference} className="text-sm">{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Legal & Setup</h2>
              <p className="text-gray-600">Final steps to complete your studio setup</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessLicense">Business License Number</Label>
                  <Input
                    id="businessLicense"
                    value={setupData.businessLicense}
                    onChange={(e) => updateSetupData('businessLicense', e.target.value)}
                    placeholder="License number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance">Insurance Provider</Label>
                  <Input
                    id="insurance"
                    value={setupData.insurance}
                    onChange={(e) => updateSetupData('insurance', e.target.value)}
                    placeholder="Insurance company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (EIN)</Label>
                  <Input
                    id="taxId"
                    value={setupData.taxId}
                    onChange={(e) => updateSetupData('taxId', e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankingDetails">Banking Information</Label>
                  <Input
                    id="bankingDetails"
                    value={setupData.bankingDetails}
                    onChange={(e) => updateSetupData('bankingDetails', e.target.value)}
                    placeholder="Bank account details"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={setupData.termsAccepted}
                    onCheckedChange={(checked) => updateSetupData('termsAccepted', checked)}
                  />
                  <Label htmlFor="termsAccepted" className="text-sm leading-6">
                    I agree to the <a href="/terms" className="text-[#1E90FF] underline">Terms of Service</a> and understand the platform fees and policies. *
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacyAccepted"
                    checked={setupData.privacyAccepted}
                    onCheckedChange={(checked) => updateSetupData('privacyAccepted', checked)}
                  />
                  <Label htmlFor="privacyAccepted" className="text-sm leading-6">
                    I agree to the <a href="/privacy" className="text-[#1E90FF] underline">Privacy Policy</a> and consent to data processing for platform operations. *
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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <OnboardingLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            stepLabels={stepLabels}
          />
          
          <Card className="mt-8">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          <OnboardingSteps
            currentStep={currentStep}
            totalSteps={totalSteps}
            canAdvance={canAdvanceStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onComplete={handleSubmit}
            loading={loading}
          />
        </div>

        {showWelcomeTour && (
          <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />
        )}
      </div>
    </OnboardingLayout>
  )
}