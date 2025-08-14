'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import StepRail from '@/components/onboarding/StepRail'
import StepCard from '@/components/onboarding/StepCard'
import StepActions from '@/components/onboarding/StepActions'
import MapboxAutocomplete from '@/components/onboarding/MapboxAutocomplete'
import { useAutosave } from '@/components/onboarding/useAutosave'
import { instructorProfileSchema, instructorLocationSchema, instructorAvailabilitySchema, instructorRatesSchema, instructorVisibilitySchema, instructorSetupSchema } from '@/components/onboarding/schemas'
import { User, Award, Calendar, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { syncCustomClaims } from '@/lib/client-session'
import tzlookup from 'tz-lookup'

export default function InstructorOnboarding() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const totalSteps = 6
  const stepLabels = ['Profile', 'Location', 'Availability', 'Rates', 'Visibility', 'Setup']

  // ✅ FIXED: Separated state objects to prevent cross-contamination
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)

  // Separate state objects for each step
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    publicBio: '',
    specialties: [],
    languages: [],
  })

  const [locationData, setLocationData] = useState({
    homeZip: '',
    city: '',
    state: '',
    lat: undefined,
    lng: undefined,
    travelRadiusKm: 0,
    remoteAvailable: true,
  })

  const [availabilityData, setAvailabilityData] = useState({
    windows: [
      { day: 'Mon', start: '06:00', end: '09:00' },
      { day: 'Mon', start: '17:00', end: '20:00' },
      { day: 'Tue', start: '06:00', end: '09:00' },
      { day: 'Tue', start: '17:00', end: '20:00' },
      { day: 'Wed', start: '06:00', end: '09:00' },
      { day: 'Wed', start: '17:00', end: '20:00' },
      { day: 'Thu', start: '06:00', end: '09:00' },
      { day: 'Thu', start: '17:00', end: '20:00' },
      { day: 'Fri', start: '06:00', end: '09:00' },
      { day: 'Fri', start: '17:00', end: '20:00' },
    ],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  })
  const [geoTimeZone, setGeoTimeZone] = useState('')
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const [showAvailabilityWarn, setShowAvailabilityWarn] = useState(false)
  const firstAvailabilityRef = useRef(null)

  const [ratesData, setRatesData] = useState({
    hourlyRate: 50,
    minSessionLengthMins: 60,
  })

  const [visibilityData, setVisibilityData] = useState({ marketplaceVisible: false })

  const [setupData, setSetupData] = useState({ avatarUrl: '', bannerUrl: '', stripeConnected: false })

  // ✅ FIXED: Proper validation with memoization
  const isProfileValid = useMemo(() => instructorProfileSchema.safeParse(profileData).success, [profileData])

  const isLocationValid = useMemo(() => instructorLocationSchema.safeParse(locationData).success, [locationData])

  const isAvailabilityValid = useMemo(() => instructorAvailabilitySchema.safeParse(availabilityData).success, [availabilityData])

  const isRatesValid = useMemo(() => instructorRatesSchema.safeParse(ratesData).success, [ratesData])

  const isVisibilityValid = useMemo(() => instructorVisibilitySchema.safeParse(visibilityData).success, [visibilityData])
  const isSetupValid = useMemo(() => instructorSetupSchema.safeParse(setupData).success, [setupData])

  // ✅ FIXED: Validation logic using memoized values
  const canAdvanceStep = useMemo(() => {
    switch (currentStep) {
      case 1: return isProfileValid
      case 2: return isLocationValid
      case 3: return true // availability can be empty; warn only
      case 4: return isRatesValid
      case 5: return isVisibilityValid
      case 6: return isSetupValid
      default: return false
    }
  }, [currentStep, isProfileValid, isLocationValid, isRatesValid, isVisibilityValid, isSetupValid])

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

  const proceedNext = useCallback(() => {
    window.dataLayer?.push({ event: 'onboarding_next', role: 'instructor', step: currentStep })
    setCurrentStep((s) => Math.min(totalSteps, s + 1))
  }, [currentStep, totalSteps])

  const nextStep = useCallback(() => {
    if (currentStep === 3 && (availabilityData.windows?.length || 0) === 0) {
      setShowAvailabilityWarn(true)
      window.dataLayer?.push({ event: 'onboarding_warn_availability_empty', role: 'instructor' })
      return
    }
    if (currentStep < totalSteps && canAdvanceStep) {
      proceedNext()
    }
  }, [currentStep, totalSteps, canAdvanceStep, availabilityData.windows, proceedNext])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const autosave = useAutosave(async () => {
    if (!user) return
    const instructorDoc = doc(db, 'instructors', user.uid)
    const profileDoc = doc(db, 'profiles', user.uid)
    const payload = {
      userId: user.uid,
      ...profileData,
      location: locationData,
      availability: availabilityData,
      rates: ratesData,
      visibility: visibilityData,
      setup: setupData,
      updatedAt: new Date(),
    }
    await setDoc(instructorDoc, payload, { merge: true })
    await setDoc(profileDoc, { role: 'instructor', onboardingComplete: false, updatedAt: new Date() }, { merge: true })
  })

  const handleComplete = async () => {
    if (!canAdvanceStep || loading || !user) return
    setLoading(true)
    try {
      await setDoc(doc(db, 'profiles', user.uid), { role: 'instructor', onboardingComplete: true, updatedAt: new Date() }, { merge: true })
      await syncCustomClaims()
      window.dataLayer?.push({ event: 'onboarding_complete', role: 'instructor' })
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

    // Allow user to be here while selecting role

    // Check if this is first time user
    const hasSeenTour = localStorage.getItem(`tour_seen_${user?.uid}`)
    if (!hasSeenTour && user) {
      setShowWelcomeTour(true)
    }
    
    // Load saved data
    // Seed analytics
    window.dataLayer?.push({ event: 'onboarding_step_view', role: 'instructor', step: 1 })
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
          <StepCard title="Profile" subtitle="Tell us about yourself as a fitness professional.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={profileData.firstName} onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={profileData.lastName} onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Phone (E.164)</Label>
                <Input placeholder="+15551234567" value={profileData.phone} onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))} onBlur={() => autosave()} />
              </div>
              <div className="md:col-span-2">
                <Label>Professional Bio *</Label>
                <Textarea value={profileData.publicBio} maxLength={280} onChange={(e) => setProfileData(prev => ({ ...prev, publicBio: e.target.value.slice(0,280) }))} onBlur={() => autosave()} rows={3} />
                <div className="text-xs text-gray-500">{(profileData.publicBio || '').length}/280</div>
              </div>
              <div>
                <Label>Specialties</Label>
                <Input placeholder="Yoga, HIIT" onBlur={(e) => { setProfileData(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })); autosave() }} />
              </div>
              <div>
                <Label>Languages</Label>
                <Input placeholder="English, Spanish" onBlur={(e) => { setProfileData(prev => ({ ...prev, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })); autosave() }} />
              </div>
            </div>
          </StepCard>
        )

      case 2:
        return (
          <StepCard title="Location" subtitle="Where are you based?">
            <div className="space-y-4">
              <Label>Search City or ZIP</Label>
              <MapboxAutocomplete onSelect={(sel) => {
                const tz = (() => { try { return tzlookup(sel.lat, sel.lng) } catch { return browserTimeZone } })()
                setGeoTimeZone(tz)
                setLocationData(prev => ({ ...prev, city: sel.city, state: sel.state, lat: sel.lat, lng: sel.lng }))
                setAvailabilityData(prev => ({ ...prev, timeZone: tz || browserTimeZone }))
                autosave()
              }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Home ZIP</Label>
                  <Input value={locationData.homeZip} onChange={(e) => setLocationData(prev => ({ ...prev, homeZip: e.target.value }))} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={locationData.city} onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={locationData.state} onChange={(e) => setLocationData(prev => ({ ...prev, state: e.target.value }))} onBlur={() => autosave()} />
                </div>
                <div>
                  <Label>Travel Radius (km)</Label>
                  <Input type="number" min={0} max={100} value={locationData.travelRadiusKm} onChange={(e) => setLocationData(prev => ({ ...prev, travelRadiusKm: Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10))) }))} onBlur={() => autosave()} />
                </div>
                <label className="flex items-center gap-2">
                  <Checkbox checked={locationData.remoteAvailable} onCheckedChange={(c) => { setLocationData(prev => ({ ...prev, remoteAvailable: !!c })); autosave() }} />
                  <span>Remote sessions available</span>
                </label>
              </div>
              {locationData.lat && locationData.lng && geoTimeZone && geoTimeZone !== availabilityData.timeZone && (
                <div className="text-xs text-gray-600">We detected {geoTimeZone}. Using {availabilityData.timeZone}. You can change this.</div>
              )}
            </div>
          </StepCard>
        )

      case 3:
        return (
          <StepCard title="Availability" subtitle="When are you available?">
            {showAvailabilityWarn && (
              <div className="mb-4 p-3 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-yellow-800 flex items-center justify-between">
                <span>You haven’t set hours yet. You can continue, but you won’t appear in time-based searches.</span>
                <div className="flex items-center gap-2 ml-4">
                  <button type="button" className="px-3 py-2 border rounded" onClick={() => { setShowAvailabilityWarn(false); firstAvailabilityRef.current?.focus() }}>Set hours</button>
                  <button type="button" className="px-3 py-2 bg-black text-white rounded" onClick={() => { setShowAvailabilityWarn(false); proceedNext() }}>Continue anyway</button>
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600 mb-2">You can change this anytime. Leaving it empty is okay, but we recommend adding windows.</div>
            {availabilityData.windows.map((w, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <select ref={idx === 0 ? firstAvailabilityRef : undefined} className="border rounded px-2 py-2" value={w.day} onChange={(e) => { const c = [...availabilityData.windows]; c[idx] = { ...w, day: e.target.value }; setAvailabilityData({ ...availabilityData, windows: c }); autosave() }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <Input type="time" value={w.start} onChange={(e) => { const c = [...availabilityData.windows]; c[idx] = { ...w, start: e.target.value }; setAvailabilityData({ ...availabilityData, windows: c }); autosave() }} className="w-32" />
                <span>to</span>
                <Input type="time" value={w.end} onChange={(e) => { const c = [...availabilityData.windows]; c[idx] = { ...w, end: e.target.value }; setAvailabilityData({ ...availabilityData, windows: c }); autosave() }} className="w-32" />
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <button type="button" className="px-3 py-2 border rounded" onClick={() => { setAvailabilityData(prev => ({ ...prev, windows: [...prev.windows, { day: 'Mon', start: '06:00', end: '09:00' }] })); autosave() }}>Add window</button>
              <button type="button" className="px-3 py-2 border rounded" onClick={() => { setAvailabilityData(prev => ({ ...prev, windows: prev.windows.slice(0,-1) })); autosave() }} disabled={availabilityData.windows.length <= 1}>Remove last</button>
            </div>
            <div className="mt-4">
              <Label>Time Zone *</Label>
              <Input value={availabilityData.timeZone} onChange={(e) => { setAvailabilityData(prev => ({ ...prev, timeZone: e.target.value })); autosave() }} />
            </div>
          </StepCard>
        )

      case 4:
        return (
          <StepCard title="Rates" subtitle="Set your rate and session length.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Hourly Rate (USD)</Label>
                <Input type="number" min={10} max={500} value={ratesData.hourlyRate} onChange={(e) => setRatesData(prev => ({ ...prev, hourlyRate: Math.max(10, Math.min(500, parseInt(e.target.value || '10', 10))) }))} onBlur={() => autosave()} />
                <div className="text-xs text-gray-500">You can change this anytime.</div>
              </div>
              <div>
                <Label>Minimum Session Length</Label>
                <select className="w-full px-3 py-2 border rounded-md" value={ratesData.minSessionLengthMins} onChange={(e) => { const v = parseInt(e.target.value, 10); setRatesData(prev => ({ ...prev, minSessionLengthMins: v })); autosave() }}>
                  {[30,45,60].map(v => <option key={v} value={v}>{v} minutes</option>)}
                </select>
              </div>
            </div>
          </StepCard>
        )

      case 5:
        return (
          <StepCard title="Visibility" subtitle="Control how you're shown in the marketplace.">
            <label className="flex items-center gap-2">
              <Checkbox checked={visibilityData.marketplaceVisible} onCheckedChange={(c) => { setVisibilityData({ marketplaceVisible: !!c }); autosave() }} />
              <span>Appear in Marketplace</span>
            </label>
            <div className="text-xs text-gray-600">Free to join; 7% fee capped $12 when sourced via marketplace.</div>
          </StepCard>
        )

      case 6:
        return (
          <StepCard title="Setup" subtitle="Finish your profile.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Avatar URL</Label>
                <Input value={setupData.avatarUrl} onChange={(e) => setSetupData(prev => ({ ...prev, avatarUrl: e.target.value }))} onBlur={() => autosave()} />
              </div>
              <div>
                <Label>Banner URL</Label>
                <Input value={setupData.bannerUrl} onChange={(e) => setSetupData(prev => ({ ...prev, bannerUrl: e.target.value }))} onBlur={() => autosave()} />
              </div>
              <label className="flex items-center gap-2">
                <Checkbox checked={setupData.stripeConnected} onCheckedChange={(c) => { setSetupData(prev => ({ ...prev, stripeConnected: !!c })); autosave() }} />
                <span>Stripe Connected</span>
              </label>
            </div>
          </StepCard>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepRail steps={stepLabels} currentIndex={currentStep - 1} />
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {renderStepContent()}
          <StepActions
            currentStep={currentStep}
            totalSteps={totalSteps}
            canProceed={canAdvanceStep}
            onPrevious={prevStep}
            onNext={nextStep}
            onComplete={handleComplete}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}