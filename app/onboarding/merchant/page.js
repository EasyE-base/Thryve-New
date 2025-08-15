'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import OnboardingSteps from '@/components/onboarding/OnboardingSteps'
import StepRail from '@/components/onboarding/StepRail'
import StepCard from '@/components/onboarding/StepCard'
import StepActions from '@/components/onboarding/StepActions'
import MapboxAutocomplete from '@/components/onboarding/MapboxAutocomplete'
import { useAutosave } from '@/components/onboarding/useAutosave'
import { merchantProfileSchema, merchantLocationSchema, merchantOperationsSchema, merchantStaffSchema, merchantPricingSchema, merchantSetupSchema } from '@/components/onboarding/schemas'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import StepIndicator from '@/components/onboarding/StepIndicator'
import { CheckCircle, User, MapPin, Settings, DollarSign, Users } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { syncCustomClaims } from '@/lib/client-session'
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
    businessEmail: '',
    phone: '',
    studioName: '',
    studioType: ''
  })

  const [locationData, setLocationData] = useState({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    lat: undefined,
    lng: undefined,
  })

  const [operationsData, setOperationsData] = useState({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    businessHours: [
      { day: 'Mon', start: '09:00', end: '17:00' },
      { day: 'Tue', start: '09:00', end: '17:00' },
      { day: 'Wed', start: '09:00', end: '17:00' },
      { day: 'Thu', start: '09:00', end: '17:00' },
      { day: 'Fri', start: '09:00', end: '17:00' },
    ],
    classTypes: [],
    cancellationWindowHours: 24,
    noShowFeeCents: 0,
    lateCancelFeeCents: 0,
  })

  const [staffData, setStaffData] = useState({ invites: [] })

  const [pricingData, setPricingData] = useState({ plan: '' })

  const [setupData, setSetupData] = useState({
    brand: { logoUrl: '', primaryColor: '' },
    stripeConnected: false,
  })

  // ✅ Validation with zod schemas
  const isProfileValid = useMemo(() => merchantProfileSchema.safeParse(profileData).success, [profileData])

  const isLocationValid = useMemo(() => merchantLocationSchema.safeParse(locationData).success, [locationData.address1, locationData.city, locationData.state, locationData.zip, locationData.country])

  const isOperationsValid = useMemo(() => merchantOperationsSchema.safeParse(operationsData).success, [operationsData])

  const isStaffValid = useMemo(() => merchantStaffSchema.safeParse(staffData).success, [staffData])

  const isPricingValid = useMemo(() => merchantPricingSchema.safeParse(pricingData).success, [pricingData])

  const isSetupValid = useMemo(() => merchantSetupSchema.safeParse(setupData).success, [setupData])

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
    window.dataLayer?.push({ event: 'onboarding_next', role: 'merchant', step: currentStep })
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
    if (!canAdvanceStep || !user) return

    setLoading(true)

    try {
      // 1) Persist role + onboarding
      await setDoc(doc(db, 'profiles', user.uid), { role: 'merchant', onboardingComplete: true, updatedAt: new Date() }, { merge: true })

      // 2) Sync server-side claims
      await fetch('/api/claims/sync', { method: 'POST' })

      // 3) Refresh ID token and session cookie
      await auth.currentUser?.getIdToken(true)
      const idToken = await auth.currentUser?.getIdToken()
      if (idToken) {
        await fetch('/api/session/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
      }

      // 4) Now route
      window.dataLayer?.push({ event: 'onboarding_complete', role: 'merchant' })
      toast.success('Onboarding complete!')
      router.replace('/dashboard/merchant')
    } catch (error) {
      console.error('Onboarding submission error:', error)
      toast.error('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [canAdvanceStep, user, router])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepCard title="Profile & Business Info" subtitle="Tell us about yourself and your studio.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={profileData.firstName} onChange={(e) => { updateProfileData('firstName', e.target.value); }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={profileData.lastName} onChange={(e) => { updateProfileData('lastName', e.target.value); }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Business Email *</Label>
                <Input type="email" value={profileData.businessEmail} onChange={(e) => { updateProfileData('businessEmail', e.target.value); }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Phone (E.164)</Label>
                <Input placeholder="+15551234567" value={profileData.phone} onChange={(e) => { updateProfileData('phone', e.target.value); }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Studio Name *</Label>
                <Input value={profileData.studioName} onChange={(e) => { updateProfileData('studioName', e.target.value); }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Studio Type *</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={profileData.studioType} onChange={(e) => { updateProfileData('studioType', e.target.value); }} onBlur={() => autosave()}>
                  <option value="">Select studio type</option>
                  <option value="yoga">Yoga</option>
                  <option value="pilates">Pilates</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="dance">Dance</option>
                  <option value="martial-arts">Martial Arts</option>
                  <option value="general-fitness">General Fitness</option>
                  <option value="specialized">Specialized</option>
                </select>
              </div>
            </div>
          </StepCard>
        )

      case 2:
        return (
          <StepCard title="Location" subtitle="Where is your studio located?">
            <div className="space-y-4">
              <Label>Search Address</Label>
              <MapboxAutocomplete
                defaultValue={locationData.address1}
                onSelect={(sel) => { setLocationData(prev => ({ ...prev, ...sel })); autosave() }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Address 1 *</Label>
                  <Input value={locationData.address1} onChange={(e) => { updateLocationData('address1', e.target.value) }} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>Address 2</Label>
                  <Input value={locationData.address2} onChange={(e) => { updateLocationData('address2', e.target.value) }} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={locationData.city} onChange={(e) => { updateLocationData('city', e.target.value) }} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input value={locationData.state} onChange={(e) => { updateLocationData('state', e.target.value) }} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>ZIP *</Label>
                  <Input value={locationData.zip} onChange={(e) => { updateLocationData('zip', e.target.value) }} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input value={locationData.country} onChange={(e) => { updateLocationData('country', e.target.value) }} onBlur={() => autosave()} />
                </div>
              </div>
            </div>
          </StepCard>
        )

      case 3:
        return (
          <StepCard title="Operations" subtitle="Hours, policies, and types.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Time Zone *</Label>
                <Input value={operationsData.timeZone} onChange={(e) => { updateOperationsData('timeZone', e.target.value) }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Cancellation Window (hours)</Label>
                <Input type="number" min={0} max={48} value={operationsData.cancellationWindowHours} onChange={(e) => { updateOperationsData('cancellationWindowHours', parseInt(e.target.value || '0', 10)) }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>No-Show Fee (USD)</Label>
                <Input type="number" min={0} max={200} value={Math.round(operationsData.noShowFeeCents / 100)} onChange={(e) => { const usd = Math.max(0, Math.min(200, parseInt(e.target.value || '0', 10))); updateOperationsData('noShowFeeCents', usd * 100) }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Late Cancel Fee (USD)</Label>
                <Input type="number" min={0} max={200} value={Math.round(operationsData.lateCancelFeeCents / 100)} onChange={(e) => { const usd = Math.max(0, Math.min(200, parseInt(e.target.value || '0', 10))); updateOperationsData('lateCancelFeeCents', usd * 100) }} onBlur={() => autosave()} />
              </div>
            </div>
            <div className="mt-4">
              <Label>Business Hours *</Label>
              {operationsData.businessHours.map((bh, idx) => (
                <div key={idx} className="flex items-center gap-3 mt-2">
                  <select className="border rounded px-2 py-2" value={bh.day} onChange={(e) => { const copy = [...operationsData.businessHours]; copy[idx] = { ...bh, day: e.target.value }; updateOperationsData('businessHours', copy) }} onBlur={() => autosave()}>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Input type="time" value={bh.start} onChange={(e) => { const copy = [...operationsData.businessHours]; copy[idx] = { ...bh, start: e.target.value }; updateOperationsData('businessHours', copy) }} onBlur={() => autosave()} className="w-32" />
                  <span>to</span>
                  <Input type="time" value={bh.end} onChange={(e) => { const copy = [...operationsData.businessHours]; copy[idx] = { ...bh, end: e.target.value }; updateOperationsData('businessHours', copy) }} onBlur={() => autosave()} className="w-32" />
                </div>
              ))}
              <div className="mt-2 flex gap-2">
                <button type="button" className="px-3 py-2 border rounded" onClick={() => { updateOperationsData('businessHours', [...operationsData.businessHours, { day: 'Mon', start: '09:00', end: '17:00' }]) }}>Add window</button>
                <button type="button" className="px-3 py-2 border rounded" onClick={() => { updateOperationsData('businessHours', operationsData.businessHours.slice(0,-1)) }} disabled={operationsData.businessHours.length <= 1}>Remove last</button>
              </div>
            </div>
            <div className="mt-4">
              <Label>Class Types</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {['Yoga','Pilates','HIIT','Strength','Dance','Cardio'].map(t => (
                  <label key={t} className="flex items-center gap-2 border rounded px-2 py-1">
                    <Checkbox checked={operationsData.classTypes.includes(t)} onCheckedChange={() => setOperationsData(prev => ({ ...prev, classTypes: prev.classTypes.includes(t) ? prev.classTypes.filter(x => x !== t) : [...prev.classTypes, t] }))} />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </StepCard>
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
          <StepCard title="Pricing" subtitle="Choose a plan.">
            <div className="space-y-3">
              <label className="flex items-center gap-2 border rounded px-3 py-2">
                <input type="radio" name="plan" checked={pricingData.plan === 'starter'} onChange={() => { setPricingData({ plan: 'starter' }) }} />
                <div>
                  <div className="font-medium">Starter $29</div>
                  <div className="text-xs text-gray-500">+ 3.75% platform fee.</div>
                </div>
              </label>
              <label className="flex items-center gap-2 border rounded px-3 py-2">
                <input type="radio" name="plan" checked={pricingData.plan === 'business_plus'} onChange={() => { setPricingData({ plan: 'business_plus' }) }} />
                <div>
                  <div className="font-medium">Business+ $59</div>
                  <div className="text-xs text-gray-500">+ 3.75% platform fee.</div>
                </div>
              </label>
              <label className="flex items-center gap-2 border rounded px-3 py-2">
                <input type="radio" name="plan" checked={pricingData.plan === 'enterprise'} onChange={() => { setPricingData({ plan: 'enterprise' }) }} />
                <div>
                  <div className="font-medium">Enterprise (Contact)</div>
                  <div className="text-xs text-gray-500">+ 3.75% platform fee.</div>
                </div>
              </label>
              <div className="text-xs text-gray-600">Programs: Member Plus 5%, Thryve X Pass 5–10% (default 8%).</div>
            </div>
          </StepCard>
        )

      case 6:
        return (
          <StepCard title="Setup" subtitle="Brand and connections.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Logo URL</Label>
                <Input value={setupData.brand.logoUrl} onChange={(e) => { setSetupData(prev => ({ ...prev, brand: { ...prev.brand, logoUrl: e.target.value } })) }} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Primary Color (hex)</Label>
                <Input value={setupData.brand.primaryColor} onChange={(e) => { setSetupData(prev => ({ ...prev, brand: { ...prev.brand, primaryColor: e.target.value } })) }} onBlur={() => autosave()} />
              </div>
              <label className="flex items-center gap-2">
                <Checkbox checked={!!setupData.stripeConnected} onCheckedChange={(c) => { setSetupData(prev => ({ ...prev, stripeConnected: !!c })); autosave() }} />
                <span>Stripe Connected</span>
              </label>
            </div>
          </StepCard>
        )

      default:
        return null
    }
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepRail steps={stepLabels} currentIndex={currentStep - 1} />
        <Card className="mt-6">
          <CardContent className="p-6 md:p-8">
            {renderStepContent()}
            <StepActions
              currentStep={currentStep}
              totalSteps={totalSteps}
              canProceed={canAdvanceStep}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onComplete={handleSubmit}
              loading={loading}
              allowSkip={currentStep === 4}
              onSkip={handleNext}
            />
          </CardContent>
        </Card>
      </div>
      {showWelcomeTour && (
        <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />
      )}
    </div>
  )
}