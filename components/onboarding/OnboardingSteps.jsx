'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export default function OnboardingSteps({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onComplete,
  canProceed = true,
  loading = false,
  nextLabel = "Next",
  completeLabel = "Complete Setup"
}) {
  const isLastStep = currentStep === totalSteps

  return (
    <div className="flex justify-between pt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center"
        size="lg"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>

      {isLastStep ? (
        <Button
          onClick={onComplete}
          disabled={loading || !canProceed}
          className="flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          size="lg"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Completing...
            </div>
          ) : (
            <div className="flex items-center">
              {completeLabel}
              <CheckCircle className="h-4 w-4 ml-2" />
            </div>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] hover:from-[#1976D2] hover:to-[#1976D2] text-white"
          size="lg"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  )
}