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
  const { user } = useAuth()
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

  // Check onboarding status when user changes
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    checkOnboardingStatus()
  }, [user])

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

      // For now, use defaults since we don't have server API
      const userRole = user.role || 'merchant' // Default to merchant for testing
      setOnboardingStatus(prev => ({
        ...prev,
        totalSteps: getTotalSteps(userRole)
      }))
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      const userRole = user.role || 'merchant'
      setOnboardingStatus(prev => ({
        ...prev,
        totalSteps: getTotalSteps(userRole)
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
      role: user?.role || 'merchant',
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
      
      // For now, complete locally since we don't have server API
      const userRole = user?.role || 'merchant'
      const completionData = {
        uid: user.uid,
        email: user.email,
        role: userRole,
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

      // Map role to correct dashboard path
      const dashboardPaths = {
        'studio': '/dashboard/merchant',
        'merchant': '/dashboard/merchant',
        'instructor': '/dashboard/instructor',
        'customer': '/dashboard/customer'
      }
      
      const dashboardPath = dashboardPaths[userRole] || '/dashboard/merchant'
      
      // Redirect to appropriate dashboard
      setTimeout(() => {
        router.push(dashboardPath)
      }, 1000)

      return { success: true }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      
      // Fallback: complete locally and redirect
      const userRole = user?.role || 'merchant'
      const completionData = {
        uid: user.uid,
        email: user.email,
        role: userRole,
        onboarding_complete: true,
        completed_at: new Date().toISOString(),
        profile_data: { ...formData, ...finalData }
      }
      
      localStorage.setItem('onboardingComplete', JSON.stringify(completionData))
      
      setOnboardingStatus(prev => ({
        ...prev,
        isComplete: true
      }))

      // Map role to correct dashboard path
      const dashboardPaths = {
        'studio': '/dashboard/merchant',
        'merchant': '/dashboard/merchant',
        'instructor': '/dashboard/instructor',
        'customer': '/dashboard/customer'
      }
      
      const dashboardPath = dashboardPaths[userRole] || '/dashboard/merchant'
      
      setTimeout(() => {
        router.push(dashboardPath)
      }, 1000)

      return { success: true, offline: true }
    } finally {
      setLoading(false)
    }
  }

  const restartOnboarding = () => {
    localStorage.removeItem('onboardingComplete')
    localStorage.removeItem(`onboarding_${user?.uid}`)
    const userRole = user?.role || 'merchant'
    setOnboardingStatus({
      isComplete: false,
      currentStep: 1,
      completedSteps: [],
      totalSteps: getTotalSteps(userRole),
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