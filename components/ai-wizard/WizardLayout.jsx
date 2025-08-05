'use client'

import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ✅ EXTRACTED: Wizard layout with progress and navigation
export default function WizardLayout({ 
  currentStep, 
  steps, 
  onNext, 
  onPrev, 
  canNext = true, 
  canPrev = true,
  loading = false,
  children 
}) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">AI Studio Configuration</h1>
                <p className="text-white/70 mt-1">Let our AI help set up your perfect studio</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Step {currentStep + 1} of {steps.length}</div>
                <div className="text-lg font-semibold text-white">{steps[currentStep]?.title}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-white/20" />
              <div className="flex justify-between text-xs text-white/60">
                {steps.map((step, index) => (
                  <span 
                    key={index}
                    className={`${index <= currentStep ? 'text-white' : 'text-white/40'}`}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            {/* Step Icon and Description */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                {(() => {
                  const IconComponent = steps[currentStep]?.icon
                  return IconComponent ? <IconComponent className="h-8 w-8 text-white" /> : null
                })()}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{steps[currentStep]?.title}</h2>
              <p className="text-white/70">{steps[currentStep]?.description}</p>
            </div>

            {/* Step Content */}
            {children}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
              <Button
                onClick={onPrev}
                disabled={!canPrev || currentStep === 0 || loading}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={onNext}
                disabled={!canNext || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}