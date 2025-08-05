import { useMemo, useCallback } from 'react'

/**
 * Universal onboarding validation hook
 * Provides consistent validation patterns across all role onboarding flows
 */
export const useOnboardingValidation = (currentStep, stepData, role) => {
  
  // ✅ Role-specific validation rules
  const validationRules = useMemo(() => {
    switch (role) {
      case 'merchant':
        return {
          1: () => !!(stepData.profile?.firstName && stepData.profile?.lastName && stepData.profile?.businessName && stepData.profile?.businessType),
          2: () => !!(stepData.location?.address && stepData.location?.city && stepData.location?.state && stepData.location?.zipCode),
          3: () => !!(stepData.operations?.cancellationPolicy),
          4: () => !!(stepData.staff?.managementStyle),
          5: () => !!(stepData.pricing?.pricingModel && stepData.pricing?.membershipTypes?.length > 0),
          6: () => !!(stepData.setup?.termsAccepted && stepData.setup?.privacyAccepted)
        }
      
      case 'instructor':
        return {
          1: () => !!(stepData.profile?.firstName && stepData.profile?.lastName && stepData.profile?.bio),
          2: () => !!(stepData.credentials?.certifications?.length > 0 && stepData.credentials?.specialties?.length > 0 && stepData.credentials?.experience),
          3: () => !!(stepData.teaching?.availability?.length > 0 && stepData.teaching?.teachingStyle),
          4: () => !!(stepData.verification?.insurance && stepData.verification?.backgroundCheck),
          5: () => !!(stepData.setup?.termsAccepted && stepData.setup?.liabilityWaiver)
        }
      
      case 'customer':
        return {
          1: () => !!(stepData.profile?.firstName && stepData.profile?.lastName && stepData.profile?.dateOfBirth),
          2: () => !!(stepData.goals?.fitnessGoals?.length > 0 && stepData.goals?.experienceLevel && stepData.goals?.preferredActivities?.length > 0),
          3: () => !!(stepData.health?.preferredTimes?.length > 0),
          4: () => !!(stepData.setup?.emergencyContact?.name && stepData.setup?.emergencyContact?.phone && stepData.setup?.paymentMethod)
        }
      
      default:
        return {}
    }
  }, [role, stepData])

  // ✅ Current step validation
  const isCurrentStepValid = useMemo(() => {
    const validator = validationRules[currentStep]
    return validator ? validator() : false
  }, [currentStep, validationRules])

  // ✅ Individual step validations (for progress indicators)
  const stepValidations = useMemo(() => {
    const validations = {}
    Object.keys(validationRules).forEach(step => {
      const validator = validationRules[step]
      validations[step] = validator ? validator() : false
    })
    return validations
  }, [validationRules])

  // ✅ Safe array toggle utility
  const createArrayToggle = useCallback((setState, field) => {
    return (value) => {
      setState(prev => ({
        ...prev,
        [field]: prev[field]?.includes(value)
          ? prev[field].filter(item => item !== value)
          : [...(prev[field] || []), value]
      }))
    }
  }, [])

  // ✅ Safe field update utility
  const createFieldUpdater = useCallback((setState) => {
    return (field, value) => {
      setState(prev => ({ ...prev, [field]: value }))
    }
  }, [])

  // ✅ Safe nested field update utility
  const createNestedUpdater = useCallback((setState, parentField) => {
    return (field, value) => {
      setState(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [field]: value
        }
      }))
    }
  }, [])

  return {
    isCurrentStepValid,
    stepValidations,
    createArrayToggle,
    createFieldUpdater,
    createNestedUpdater
  }
}

/**
 * Progress tracking hook for onboarding flows
 */
export const useOnboardingProgress = (currentStep, totalSteps, isValid, onStepComplete) => {
  
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps && isValid) {
      onStepComplete?.(currentStep)
      return currentStep + 1
    }
    return currentStep
  }, [currentStep, totalSteps, isValid, onStepComplete])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      return currentStep - 1
    }
    return currentStep
  }, [currentStep])

  const progressPercentage = useMemo(() => {
    return (currentStep / totalSteps) * 100
  }, [currentStep, totalSteps])

  return {
    nextStep,
    prevStep,
    progressPercentage
  }
}

/**
 * Form submission hook for onboarding
 */
export const useOnboardingSubmission = (role, allStepData, onComplete) => {
  
  const submitOnboarding = useCallback(async (setLoading) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/onboarding/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allStepData)
      })

      if (response.ok) {
        await onComplete?.()
        return { success: true }
      } else {
        throw new Error(`Failed to complete ${role} onboarding`)
      }
    } catch (error) {
      console.error('Onboarding submission error:', error)
      return { 
        success: false, 
        error: error.message || 'Error completing onboarding. Please try again.' 
      }
    } finally {
      setLoading(false)
    }
  }, [role, allStepData, onComplete])

  return { submitOnboarding }
}