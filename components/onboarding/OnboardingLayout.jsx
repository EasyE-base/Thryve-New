'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StepIndicator from './StepIndicator'
import { useOnboarding } from './OnboardingProvider'

export default function OnboardingLayout({ 
  children, 
  title, 
  description, 
  currentStep, 
  totalSteps, 
  stepLabels = [],
  showProgress = true,
  className = ""
}) {
  const { onboardingStatus } = useOnboarding()

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        {showProgress && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-xl text-gray-600 mb-6">{description}</p>
            )}
            
            <StepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              completedSteps={onboardingStatus.completedSteps}
              stepLabels={stepLabels}
              className="mb-8"
            />
          </div>
        )}

        {/* Main Content */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {title || 'Onboarding'}
            </CardTitle>
            <CardDescription className="text-lg">
              Step {currentStep} of {totalSteps}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}