'use client'

import React from 'react'

export default function StepActions({
  onPrevious,
  onNext,
  onComplete,
  canProceed = false,
  loading = false,
  currentStep = 1,
  totalSteps = 1,
  completeLabel = 'Finish',
  allowSkip = false,
  onSkip,
}) {
  const isLast = currentStep >= totalSteps

  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrevious}
        className="px-4 h-11 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        disabled={currentStep <= 1 || loading}
      >
        Previous
      </button>
      <div className="flex items-center gap-3">
        {allowSkip && !isLast && (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 h-11 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Skip for now
          </button>
        )}
        {isLast ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={!canProceed || loading}
            className="px-5 h-11 min-w-[140px] rounded-xl bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? 'Finishing…' : completeLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed || loading}
            className="px-5 h-11 min-w-[120px] rounded-xl bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Next'}
          </button>
        )}
      </div>
    </div>
  )
}


