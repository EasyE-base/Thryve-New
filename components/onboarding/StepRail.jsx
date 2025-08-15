'use client'

import React from 'react'

export default function StepRail({ steps, currentIndex = 0 }) {
  if (!Array.isArray(steps) || steps.length === 0) return null
  const progressPct = Math.min(100, Math.max(0, ((currentIndex + 1) / steps.length) * 100))

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-600">Step {currentIndex + 1} of {steps.length}</div>
        <div className="text-xs text-gray-600">{steps[currentIndex]}</div>
      </div>
      <div className="relative">
        <div className="h-1.5 w-full bg-gray-200 rounded-full" />
        <div
          className="h-1.5 bg-black rounded-full absolute top-0 left-0 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          aria-hidden="true"
        />
        <div className="sr-only" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={(currentIndex ?? 0) + 1} />
      </div>
      <div className="mt-3 grid grid-cols-6 gap-2 text-[11px] text-gray-500">
        {steps.map((label, idx) => (
          <div key={label} className={`truncate ${idx === currentIndex ? 'text-gray-900 font-medium' : ''}`}>{label}</div>
        ))}
      </div>
    </div>
  )
}


