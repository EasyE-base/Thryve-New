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
import { ArrowRight, ArrowLeft, CheckCircle, User, Building, MapPin, CreditCard, Settings, Camera, Zap, DollarSign, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function MerchantOnboarding() {
  const { user, role, loading: authLoading } = useAuth()
  const { onboardingStatus, formData, updateFormData, completeStep, completeOnboarding } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [stepData, setStepData] = useState({
    // Step 1: Personal & Business Info
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessEmail: '',
    
    // Step 2: Location & Details
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    amenities: [],
    capacity: [50],
    
    // Step 3: Operating Hours & Policies
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
    lateCancelFee: [10],
    
    // Step 4: Staff & Management
    staffCount: [5],
    instructorRequirements: [],
    managementStyle: '',
    hiringPlans: '',
    
    // Step 5: Pricing & Features
    membershipTypes: [],
    pricingModel: '',
    specialFeatures: [],
    marketingPreferences: [],
    
    // Step 6: Legal & Payment Setup
    businessLicense: '',
    insurance: '',
    taxId: '',
    bankingDetails: '',
    termsAccepted: false,
    privacyAccepted: false
  })
  
  const router = useRouter()
  const totalSteps = 6
  const stepLabels = ["Profile", "Location", "Operations", "Staff", "Pricing", "Setup"]

  const businessTypes = [
    'Gym/Fitness Center',
    'Yoga Studio', 
    'Pilates Studio',
    'Dance Studio',
    'Martial Arts Studio',
    'CrossFit Box',
    'Personal Training Studio',
    'Wellness Center',
    'Spa & Fitness',
    'Community Recreation Center',
    'Other'
  ]

  const amenityOptions = [
    'Parking Available', 'Locker Rooms', 'Showers', 'Equipment Rental',
    'Retail/Pro Shop', 'Juice Bar', 'WiFi', 'Air Conditioning',
    'Sound System', 'Mirrors', 'Mats Provided', 'Towel Service',
    'Child Care', 'Physical Therapy', 'Massage Services', 'Sauna/Steam Room'
  ]

  const instructorRequirementOptions = [
    'Professional Certification Required',
    'Liability Insurance Required',
    'Background Check Required',
    'CPR/First Aid Certification',
    'Minimum Years Experience',
    'Continuing Education Requirements',
    'Regular Performance Reviews'
  ]

  const membershipTypeOptions = [
    'Monthly Unlimited', 'Class Packages', 'Drop-in Classes',
    'Annual Memberships', 'Student Discounts', 'Senior Discounts',
    'Corporate Packages', 'Family Plans'
  ]

  const specialFeatureOptions = [
    'X Pass Accepted', 'Live Streaming', 'On-Demand Videos',
    'Personal Training', 'Nutrition Coaching', 'Wellness Programs',
    'Corporate Wellness', 'Youth Programs', 'Senior Programs'
  ]

  const marketingPreferenceOptions = [
    'Social Media Promotion', 'Email Marketing', 'Local Partnerships',
    'Referral Programs', 'Special Events', 'Workshop Series'
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Please sign in first')
      router.push('/')
      return
    }

    if (role && role !== 'merchant' && !authLoading) {
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Merchant onboarding: Redirecting user with role', role, 'to correct onboarding')
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

  const updateDoubleNestedData = (parent, child, field, value) => {
    setStepData(prev => {
      const newData = {
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            [field]: value
          }
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
        return stepData.firstName && stepData.lastName && stepData.businessName && stepData.businessType
      case 2:
        return stepData.address && stepData.city && stepData.state && stepData.zipCode
      case 3:
        return stepData.cancellationPolicy
      case 4:
        return stepData.managementStyle
      case 5:
        return stepData.pricingModel && stepData.membershipTypes.length > 0
      case 6:
        return stepData.termsAccepted && stepData.privacyAccepted
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
      toast.success('Welcome to Thryve Business! Your studio profile is complete.')
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal & Business Information</h2>
              <p className="text-gray-600">Tell us about yourself and your fitness business</p>
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={stepData.phone}
                  onChange={(e) => updateStepData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={stepData.businessEmail}
                  onChange={(e) => updateStepData('businessEmail', e.target.value)}
                  placeholder="info@yourstudio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={stepData.businessName}
                onChange={(e) => updateStepData('businessName', e.target.value)}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <select
                id="businessType"
                value={stepData.businessType}
                onChange={(e) => updateStepData('businessType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Location & Facility Details</h2>
              <p className="text-gray-600">Where is your business located and what do you offer?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={stepData.address}
                onChange={(e) => updateStepData('address', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={stepData.city}
                  onChange={(e) => updateStepData('city', e.target.value)}
                  placeholder="City"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={stepData.state}
                  onChange={(e) => updateStepData('state', e.target.value)}
                  placeholder="State"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  value={stepData.zipCode}
                  onChange={(e) => updateStepData('zipCode', e.target.value)}
                  placeholder="12345"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={stepData.description}
                onChange={(e) => updateStepData('description', e.target.value)}
                placeholder="Describe your business, what makes it special, and what clients can expect..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Amenities & Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {amenityOptions.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={stepData.amenities.includes(amenity)}
                      onCheckedChange={() => handleArrayToggle('amenities', amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Total Facility Capacity</Label>
              <div className="mt-3">
                <Slider
                  value={stepData.capacity}
                  onValueChange={(value) => updateStepData('capacity', value)}
                  max={500}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>10</span>
                  <span className="font-medium text-[#1E90FF]">
                    {stepData.capacity[0]} people
                  </span>
                  <span>500+</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Operating Hours & Policies</h2>
              <p className="text-gray-600">When are you open and what are your policies?</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Operating Hours</Label>
              {Object.keys(stepData.operatingHours).map((day) => (
                <div key={day} className="grid grid-cols-3 gap-4 items-center">
                  <Label className="capitalize font-medium">{day}</Label>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Open</Label>
                    <Input
                      type="time"
                      value={stepData.operatingHours[day].open}
                      onChange={(e) => updateDoubleNestedData('operatingHours', day, 'open', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Close</Label>
                    <Input
                      type="time"
                      value={stepData.operatingHours[day].close}
                      onChange={(e) => updateDoubleNestedData('operatingHours', day, 'close', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy *</Label>
              <select
                id="cancellationPolicy"
                value={stepData.cancellationPolicy}
                onChange={(e) => updateStepData('cancellationPolicy', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select cancellation policy</option>
                <option value="2-hour">2 hours before class</option>
                <option value="4-hour">4 hours before class</option>
                <option value="12-hour">12 hours before class</option>
                <option value="24-hour">24 hours before class</option>
                <option value="48-hour">48 hours before class</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">No-Show Fee</Label>
                <div className="mt-3">
                  <Slider
                    value={stepData.noShowFee}
                    onValueChange={(value) => updateStepData('noShowFee', value)}
                    max={50}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>$0</span>
                    <span className="font-medium text-[#1E90FF]">
                      ${stepData.noShowFee[0]}
                    </span>
                    <span>$50</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Late Cancel Fee</Label>
                <div className="mt-3">
                  <Slider
                    value={stepData.lateCancelFee}
                    onValueChange={(value) => updateStepData('lateCancelFee', value)}
                    max={30}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>$0</span>
                    <span className="font-medium text-[#1E90FF]">
                      ${stepData.lateCancelFee[0]}
                    </span>
                    <span>$30</span>
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
              <Users className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff & Management</h2>
              <p className="text-gray-600">Tell us about your team and hiring needs</p>
            </div>

            <div>
              <Label className="text-base font-medium">Current Staff Count</Label>
              <div className="mt-3">
                <Slider
                  value={stepData.staffCount}
                  onValueChange={(value) => updateStepData('staffCount', value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>1</span>
                  <span className="font-medium text-[#1E90FF]">
                    {stepData.staffCount[0]} staff members
                  </span>
                  <span>50+</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Instructor Requirements</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {instructorRequirementOptions.map((requirement) => (
                  <div key={requirement} className="flex items-center space-x-2">
                    <Checkbox
                      id={requirement}
                      checked={stepData.instructorRequirements.includes(requirement)}
                      onCheckedChange={() => handleArrayToggle('instructorRequirements', requirement)}
                    />
                    <Label htmlFor={requirement} className="text-sm">
                      {requirement}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managementStyle">Management Style *</Label>
              <select
                id="managementStyle"
                value={stepData.managementStyle}
                onChange={(e) => updateStepData('managementStyle', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select management style</option>
                <option value="hands-on">Hands-on Management</option>
                <option value="collaborative">Collaborative Leadership</option>
                <option value="delegative">Delegative Approach</option>
                <option value="results-oriented">Results-Oriented</option>
                <option value="supportive">Supportive & Coaching</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hiringPlans">Hiring Plans</Label>
              <Textarea
                id="hiringPlans"
                value={stepData.hiringPlans}
                onChange={(e) => updateStepData('hiringPlans', e.target.value)}
                placeholder="Do you plan to hire more instructors? What positions are you looking to fill?"
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Features</h2>
              <p className="text-gray-600">How do you structure your pricing and what features do you offer?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricingModel">Primary Pricing Model *</Label>
              <select
                id="pricingModel"
                value={stepData.pricingModel}
                onChange={(e) => updateStepData('pricingModel', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select pricing model</option>
                <option value="membership">Monthly/Annual Memberships</option>
                <option value="class-packs">Class Package System</option>
                <option value="drop-in">Drop-in Classes</option>
                <option value="hybrid">Hybrid Model</option>
                <option value="subscription">Subscription Based</option>
              </select>
            </div>

            <div>
              <Label className="text-base font-medium">Membership Types Offered *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {membershipTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={stepData.membershipTypes.includes(type)}
                      onCheckedChange={() => handleArrayToggle('membershipTypes', type)}
                    />
                    <Label htmlFor={type} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Special Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {specialFeatureOptions.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={stepData.specialFeatures.includes(feature)}
                      onCheckedChange={() => handleArrayToggle('specialFeatures', feature)}
                    />
                    <Label htmlFor={feature} className="text-sm">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Marketing Preferences</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {marketingPreferenceOptions.map((preference) => (
                  <div key={preference} className="flex items-center space-x-2">
                    <Checkbox
                      id={preference}
                      checked={stepData.marketingPreferences.includes(preference)}
                      onCheckedChange={() => handleArrayToggle('marketingPreferences', preference)}
                    />
                    <Label htmlFor={preference} className="text-sm">
                      {preference}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal & Payment Setup</h2>
              <p className="text-gray-600">Final details to get your studio up and running</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessLicense">Business License Number</Label>
                <Input
                  id="businessLicense"
                  value={stepData.businessLicense}
                  onChange={(e) => updateStepData('businessLicense', e.target.value)}
                  placeholder="Business license number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Liability Insurance</Label>
                <Input
                  id="insurance"
                  value={stepData.insurance}
                  onChange={(e) => updateStepData('insurance', e.target.value)}
                  placeholder="Insurance provider/policy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={stepData.taxId}
                  onChange={(e) => updateStepData('taxId', e.target.value)}
                  placeholder="Federal tax ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankingDetails">Banking Information</Label>
                <Input
                  id="bankingDetails"
                  value={stepData.bankingDetails}
                  onChange={(e) => updateStepData('bankingDetails', e.target.value)}
                  placeholder="Bank account for payments"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={stepData.termsAccepted}
                  onCheckedChange={(checked) => updateStepData('termsAccepted', checked)}
                />
                <Label htmlFor="termsAccepted" className="text-sm">
                  I agree to the Terms of Service and Merchant Agreement *
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacyAccepted"
                  checked={stepData.privacyAccepted}
                  onCheckedChange={(checked) => updateStepData('privacyAccepted', checked)}
                />
                <Label htmlFor="privacyAccepted" className="text-sm">
                  I agree to Privacy Policy and data handling practices *
                </Label>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Zap className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Ready to Launch!</h3>
              </div>
              <p className="text-green-800 text-sm">
                Complete your setup to start managing your studio, staff, and classes on Thryve Business.
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Thryve Business! 🏢</h1>
          <p className="text-xl text-gray-600 mb-6">Let's set up your studio management profile</p>
          
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
            <CardTitle className="text-2xl">Studio Owner Onboarding</CardTitle>
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
              completeLabel="Launch My Studio"
            />
          </CardContent>
        </Card>
      </div>

      {/* Welcome Tour */}
      <WelcomeTour
        isOpen={showWelcomeTour}
        onClose={() => setShowWelcomeTour(false)}
        userRole="merchant"
      />
    </div>
  )
}