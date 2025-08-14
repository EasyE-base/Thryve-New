'use client'

import React from 'react'

export default function StepCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )}


