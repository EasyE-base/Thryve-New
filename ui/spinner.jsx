import React from 'react'

export function Spinner({ className = "" }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}>
    </div>
  )
}