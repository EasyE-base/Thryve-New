'use client'

import React from 'react'
import { CheckCircle, Circle, ArrowRight } from 'lucide-react'

export default function StepIndicator({ 
  currentStep, 
  totalSteps, 
  completedSteps = [],
  stepLabels = [],
  className = "" 
}) {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1)

  const getStepStatus = (stepNumber) => {
    if (completedSteps.includes(stepNumber)) {
      return 'completed'
    } else if (stepNumber === currentStep) {
      return 'current'
    } else if (stepNumber < currentStep) {
      return 'completed'
    } else {
      return 'upcoming'
    }
  }

  const getStepIcon = (stepNumber) => {
    const status = getStepStatus(stepNumber)
    
    if (status === 'completed') {
      return <CheckCircle className="h-8 w-8 text-white" />
    } else if (status === 'current') {
      return (
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#1E90FF] font-bold text-lg">{stepNumber}</span>
        </div>
      )
    } else {
      return (
        <Circle className="h-8 w-8 text-gray-400" />
      )
    }
  }

  const getStepStyles = (stepNumber) => {
    const status = getStepStatus(stepNumber)
    
    if (status === 'completed') {
      return 'bg-[#1E90FF] border-[#1E90FF]'
    } else if (status === 'current') {
      return 'bg-[#1E90FF] border-[#1E90FF]'
    } else {
      return 'bg-gray-100 border-gray-300'
    }
  }

  const getConnectorStyles = (stepNumber) => {
    const status = getStepStatus(stepNumber)
    const nextStatus = getStepStatus(stepNumber + 1)
    
    if (status === 'completed') {
      return 'bg-[#1E90FF]'
    } else {
      return 'bg-gray-300'
    }
  }

  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {steps.map((stepNumber, index) => (
        <React.Fragment key={stepNumber}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStepStyles(stepNumber)}`}
            >
              {getStepIcon(stepNumber)}
            </div>
            
            {stepLabels[index] && (
              <div className="mt-2 text-center max-w-20">
                <span className="text-sm text-gray-600 font-medium">
                  {stepLabels[index]}
                </span>
              </div>
            )}
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="flex items-center">
              <div className={`w-12 h-0.5 transition-all duration-300 ${getConnectorStyles(stepNumber)}`} />
              <ArrowRight className="h-4 w-4 text-gray-400 mx-1" />
              <div className={`w-12 h-0.5 transition-all duration-300 ${getConnectorStyles(stepNumber)}`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}