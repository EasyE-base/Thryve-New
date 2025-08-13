'use client'

import { useState } from 'react'

export default function ZipSearchBar({ onSubmit, onUseLocation, disabled = false }) {
  const [zip, setZip] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{5}$/.test(zip)) {
      setError('Enter a valid 5-digit ZIP')
      return
    }
    onSubmit?.(zip)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-wrap gap-2 items-center justify-center mx-auto">
      <input
        type="text"
        inputMode="numeric"
        pattern="\\d{5}"
        maxLength={5}
        placeholder="Enter ZIP code"
        className="w-40 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ''))}
        disabled={disabled}
        aria-label="ZIP code"
      />
      <button type="submit" className="rounded-md bg-white px-4 py-2 font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60" disabled={disabled}>
        Set ZIP
      </button>
      <button type="button" className="rounded-md bg-white/10 px-4 py-2 font-semibold text-white ring-1 ring-white/40 hover:bg-white/20 disabled:opacity-60" onClick={onUseLocation} disabled={disabled}>
        Use my location
      </button>
      {error && <div className="w-full mt-2 text-sm text-rose-300 text-center">{error}</div>}
    </form>
  )
}


