import { useState, useMemo, useCallback } from 'react'

export const useOnboardingForm = (initialData = {}) => {
  // ✅ Separate state objects to prevent cross-contamination
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessEmail: '',
    ...initialData.profile
  })

  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    amenities: [],
    capacity: [50],
    ...initialData.location
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
    lateCancelFee: [10],
    ...initialData.operations
  })

  const [staffData, setStaffData] = useState({
    staffCount: [5],
    instructorRequirements: [],
    managementStyle: '',
    hiringPlans: '',
    ...initialData.staff
  })

  const [pricingData, setPricingData] = useState({
    membershipTypes: [],
    pricingModel: '',
    specialFeatures: [],
    marketingPreferences: [],
    ...initialData.pricing
  })

  const [setupData, setSetupData] = useState({
    businessLicense: '',
    insurance: '',
    taxId: '',
    bankingDetails: '',
    termsAccepted: false,
    privacyAccepted: false,
    ...initialData.setup
  })

  // ✅ Memoized validation for each step
  const isProfileValid = useMemo(() => {
    return profileData.firstName && 
           profileData.lastName && 
           profileData.businessName && 
           profileData.businessType
  }, [profileData.firstName, profileData.lastName, profileData.businessName, profileData.businessType])

  const isLocationValid = useMemo(() => {
    return locationData.address && 
           locationData.city && 
           locationData.state && 
           locationData.zipCode
  }, [locationData.address, locationData.city, locationData.state, locationData.zipCode])

  const isOperationsValid = useMemo(() => {
    return operationsData.cancellationPolicy
  }, [operationsData.cancellationPolicy])

  const isStaffValid = useMemo(() => {
    return staffData.managementStyle
  }, [staffData.managementStyle])

  const isPricingValid = useMemo(() => {
    return pricingData.pricingModel && pricingData.membershipTypes.length > 0
  }, [pricingData.pricingModel, pricingData.membershipTypes])

  const isSetupValid = useMemo(() => {
    return setupData.termsAccepted && setupData.privacyAccepted
  }, [setupData.termsAccepted, setupData.privacyAccepted])

  // ✅ Safe update functions that don't affect other steps
  const updateProfile = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateLocation = useCallback((field, value) => {
    setLocationData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateLocationAmenities = useCallback((amenity) => {
    setLocationData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }, [])

  const updateOperations = useCallback((field, value) => {
    setOperationsData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateOperatingHours = useCallback((day, timeType, value) => {
    setOperationsData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [timeType]: value
        }
      }
    }))
  }, [])

  const updateStaff = useCallback((field, value) => {
    setStaffData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateStaffRequirements = useCallback((requirement) => {
    setStaffData(prev => ({
      ...prev,
      instructorRequirements: prev.instructorRequirements.includes(requirement)
        ? prev.instructorRequirements.filter(r => r !== requirement)
        : [...prev.instructorRequirements, requirement]
    }))
  }, [])

  const updatePricing = useCallback((field, value) => {
    setPricingData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updatePricingArray = useCallback((field, value) => {
    setPricingData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }, [])

  const updateSetup = useCallback((field, value) => {
    setSetupData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ✅ Combined data for submission
  const getAllData = useCallback(() => ({
    ...profileData,
    ...locationData,
    ...operationsData,
    ...staffData,
    ...pricingData,
    ...setupData
  }), [profileData, locationData, operationsData, staffData, pricingData, setupData])

  // ✅ Step validation function
  const isStepValid = useCallback((stepNumber) => {
    switch (stepNumber) {
      case 1: return isProfileValid
      case 2: return isLocationValid
      case 3: return isOperationsValid
      case 4: return isStaffValid
      case 5: return isPricingValid
      case 6: return isSetupValid
      default: return false
    }
  }, [isProfileValid, isLocationValid, isOperationsValid, isStaffValid, isPricingValid, isSetupValid])

  return {
    // Data
    profileData,
    locationData,
    operationsData,
    staffData,
    pricingData,
    setupData,
    
    // Update functions
    updateProfile,
    updateLocation,
    updateLocationAmenities,
    updateOperations,
    updateOperatingHours,
    updateStaff,
    updateStaffRequirements,
    updatePricing,
    updatePricingArray,
    updateSetup,
    
    // Validation
    isStepValid,
    isProfileValid,
    isLocationValid,
    isOperationsValid,
    isStaffValid,
    isPricingValid,
    isSetupValid,
    
    // Utilities
    getAllData
  }
}