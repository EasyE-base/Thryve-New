'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'

export default function ProgressBar({ 
  currentStep, 
  totalSteps, 
  completedSteps = [],
  showPercentage = true,
  showStepCount = true,
  className = ""
}) {
  const progressValue = (currentStep / totalSteps) * 100
  const completedStepsCount = completedSteps.length

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        {showStepCount && (
          <span className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
        )}
        {showPercentage && (
          <span className="text-sm text-gray-600">
            {Math.round(progressValue)}% complete
          </span>
        )}
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-3"
      />
      
      {completedStepsCount > 0 && (
        <div className="text-xs text-green-600">
          {completedStepsCount} step{completedStepsCount > 1 ? 's' : ''} completed
        </div>
      )}
    </div>
  )
}