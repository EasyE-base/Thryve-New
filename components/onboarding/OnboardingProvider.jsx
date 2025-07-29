'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

const OnboardingContext = createContext({})

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export default function OnboardingProvider({ children }) {
  const { user, role } = useAuth()
  const router = useRouter()
  const [onboardingStatus, setOnboardingStatus] = useState({
    isComplete: false,
    currentStep: 1,
    completedSteps: [],
    totalSteps: 3,
    lastSaved: null
  })
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)

  // Check onboarding status when user/role changes
  useEffect(() => {
    if (!user || !role) {
      setLoading(false)
      return
    }

    checkOnboardingStatus()
  }, [user, role])

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true)
      
      // First check localStorage for quick access
      const localData = localStorage.getItem('onboardingComplete')
      if (localData) {
        try {
          const parsedData = JSON.parse(localData)
          if (parsedData.uid === user.uid && parsedData.onboarding_complete) {
            setOnboardingStatus(prev => ({
              ...prev,
              isComplete: true,
              currentStep: parsedData.totalSteps || 3,
              completedSteps: Array.from({ length: parsedData.totalSteps || 3 }, (_, i) => i + 1)
            }))
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('Failed to parse local onboarding data:', e)
        }
      }

      // Check with server
      const response = await fetch('/server-api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOnboardingStatus({
          isComplete: data.onboarding_complete || false,
          currentStep: data.current_step || 1,
          completedSteps: data.completed_steps || [],
          totalSteps: data.total_steps || getTotalSteps(role),
          lastSaved: data.last_saved
        })
        
        if (data.profile_data) {
          setFormData(data.profile_data)
        }
      } else {
        // Server error - use defaults
        setOnboardingStatus(prev => ({
          ...prev,
          totalSteps: getTotalSteps(role)
        }))
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setOnboardingStatus(prev => ({
        ...prev,
        totalSteps: getTotalSteps(role)
      }))
    } finally {
      setLoading(false)
    }
  }

  const getTotalSteps = (userRole) => {
    switch (userRole) {
      case 'customer': return 4 // Enhanced customer flow
      case 'instructor': return 5 // Enhanced instructor flow
      case 'merchant': return 6 // Enhanced merchant flow
      default: return 3
    }
  }

  const updateFormData = (stepData, stepNumber) => {
    setFormData(prev => ({
      ...prev,
      [`step${stepNumber}`]: stepData
    }))
    
    // Auto-save to localStorage
    const saveData = {
      uid: user?.uid,
      role,
      formData: { ...formData, [`step${stepNumber}`]: stepData },
      currentStep: stepNumber,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem(`onboarding_${user?.uid}`, JSON.stringify(saveData))
  }

  const completeStep = (stepNumber) => {
    setOnboardingStatus(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep, stepNumber + 1),
      completedSteps: [...prev.completedSteps.filter(s => s !== stepNumber), stepNumber]
    }))
  }

  const skipStep = (stepNumber) => {
    setOnboardingStatus(prev => ({
      ...prev,
      currentStep: stepNumber + 1
    }))
  }

  const completeOnboarding = async (finalData) => {
    try {
      setLoading(true)
      
      const response = await fetch('/server-api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          role,
          profileData: { ...formData, ...finalData },
          completedSteps: onboardingStatus.completedSteps,
          totalSteps: onboardingStatus.totalSteps
        })
      })

      if (response.ok || response.status === 502) {
        // Mark as complete locally regardless of API success
        const completionData = {
          uid: user.uid,
          email: user.email,
          role,
          onboarding_complete: true,
          completed_at: new Date().toISOString(),
          profile_data: { ...formData, ...finalData }
        }
        
        localStorage.setItem('onboardingComplete', JSON.stringify(completionData))
        
        setOnboardingStatus(prev => ({
          ...prev,
          isComplete: true,
          currentStep: prev.totalSteps,
          completedSteps: Array.from({ length: prev.totalSteps }, (_, i) => i + 1)
        }))

        // Redirect to appropriate dashboard
        setTimeout(() => {
          router.push(`/dashboard/${role}`)
        }, 1000)

        return { success: true }
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      
      // Fallback: complete locally and redirect
      const completionData = {
        uid: user.uid,
        email: user.email,
        role,
        onboarding_complete: true,
        completed_at: new Date().toISOString(),
        profile_data: { ...formData, ...finalData }
      }
      
      localStorage.setItem('onboardingComplete', JSON.stringify(completionData))
      
      setOnboardingStatus(prev => ({
        ...prev,
        isComplete: true
      }))

      setTimeout(() => {
        router.push(`/dashboard/${role}`)
      }, 1000)

      return { success: true, offline: true }
    } finally {
      setLoading(false)
    }
  }

  const restartOnboarding = () => {
    localStorage.removeItem('onboardingComplete')
    localStorage.removeItem(`onboarding_${user?.uid}`)
    setOnboardingStatus({
      isComplete: false,
      currentStep: 1,
      completedSteps: [],
      totalSteps: getTotalSteps(role),
      lastSaved: null
    })
    setFormData({})
  }

  const value = {
    onboardingStatus,
    formData,
    loading,
    updateFormData,
    completeStep,
    skipStep,
    completeOnboarding,
    restartOnboarding,
    checkOnboardingStatus
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}