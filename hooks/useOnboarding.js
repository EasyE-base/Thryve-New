'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Onboarding hook for managing onboarding flow state
export function useOnboarding() {
  const [onboardingStatus, setOnboardingStatus] = useState({
    isComplete: false,
    currentStep: 0,
    completedSteps: []
  })
  
  const [formData, setFormData] = useState({
    profile: {},
    goals: {},
    health: {},
    setup: {}
  })
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Load onboarding status from localStorage
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem('onboarding-status')
      const savedData = localStorage.getItem('onboarding-data')
      
      if (savedStatus) {
        setOnboardingStatus(JSON.parse(savedStatus))
      }
      
      if (savedData) {
        setFormData(JSON.parse(savedData))
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem('onboarding-status', JSON.stringify(onboardingStatus))
      localStorage.setItem('onboarding-data', JSON.stringify(formData))
    } catch (error) {
      console.error('Error saving onboarding data:', error)
    }
  }, [onboardingStatus, formData])

  const updateFormData = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }))
  }, [])

  const completeStep = useCallback(async (stepIndex) => {
    try {
      setLoading(true)
      
      setOnboardingStatus(prev => ({
        ...prev,
        completedSteps: [...new Set([...prev.completedSteps, stepIndex])],
        currentStep: Math.max(prev.currentStep, stepIndex + 1)
      }))
      
      // Mock API call to save step completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return true
    } catch (error) {
      console.error('Error completing step:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const completeOnboarding = useCallback(async () => {
    try {
      setLoading(true)
      
      // Mock API call to complete onboarding
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setOnboardingStatus(prev => ({
        ...prev,
        isComplete: true
      }))
      
      // Redirect to dashboard based on role or preference
      router.push('/dashboard')
      
      return true
    } catch (error) {
      console.error('Error completing onboarding:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [router])

  const resetOnboarding = useCallback(() => {
    setOnboardingStatus({
      isComplete: false,
      currentStep: 0,
      completedSteps: []
    })
    setFormData({
      profile: {},
      goals: {},
      health: {},
      setup: {}
    })
    localStorage.removeItem('onboarding-status')
    localStorage.removeItem('onboarding-data')
  }, [])

  const goToStep = useCallback((stepIndex) => {
    setOnboardingStatus(prev => ({
      ...prev,
      currentStep: stepIndex
    }))
  }, [])

  const isStepCompleted = useCallback((stepIndex) => {
    return onboardingStatus.completedSteps.includes(stepIndex)
  }, [onboardingStatus.completedSteps])

  const canAccessStep = useCallback((stepIndex) => {
    // User can access current step or any completed step
    return stepIndex <= onboardingStatus.currentStep
  }, [onboardingStatus.currentStep])

  return {
    onboardingStatus,
    formData,
    loading,
    updateFormData,
    completeStep,
    completeOnboarding,
    resetOnboarding,
    goToStep,
    isStepCompleted,
    canAccessStep
  }
}