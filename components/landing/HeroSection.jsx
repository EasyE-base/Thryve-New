'use client'

import { useState, useEffect, useRef } from 'react'

// ✅ EXTRACTED: Hero section with video backgrounds
const BADGES = ['5 Min Setup','Sync From Other Platforms','Payouts Daily']

const normalize = r => {
  const v = (r || '').toLowerCase()
  return (v === 'studio-owner' || v === 'studio' || v === 'merchant') ? 'merchant' : v
}
const PERSONAS = [
  { label: 'Studios', value: 'merchant' },     // studio-owner/merchant/studio → merchant
  { label: 'Instructors', value: 'instructor' },
  { label: 'Members', value: 'customer' },     // display "Members", keep role 'customer'
]
const SUBHEAD = 'Powerful tools to help manage your business, easy 5-minute sync from other platforms, growth analytics, and community-driven.'
const HERO_VIDEOS = [
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/9acvnc7j_social_based.him_A_vibrant_dynamic_photograph_captures_a_full_body_y_6b0e1611-f8ba-498d-82cb-f11a897e2e3c_1.mp4",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/ecnrqgwm_social_based.him_A_vibrant_dynamic_photograph_captures_a_young_man_r_b5e14506-2983-42c6-8ad5-d9fd686f8466_3.mp4",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/nviy43ax_08%281%29.mov",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/m42oytgc_0728.mov",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/yqyftmfn_social_based.him_A_vibrant_dynamic_zoomed_out_photograph_of_a_full_b_4e9f2572-18d6-4c2b-9b4f-ee49eec6d415_1.mp4"
]

const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1593810451056-0acc1fad48c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1598596583430-c81c94b52dad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85"
]

export default function HeroSection() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const heroRef = useRef(null)

  const [persona, setPersona] = useState(() => {
    const qp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('role') : null
    const saved = typeof window !== 'undefined' ? localStorage.getItem('thryve_persona') : null
    return normalize((qp || saved || 'merchant'))
  })

  useEffect(() => {
    try {
      localStorage.setItem('thryve_persona', persona)
      const url = new URL(window.location.href)
      url.searchParams.set('role', persona)
      window.history.replaceState({}, '', url)
    } catch {}
  }, [persona])

  const primaryHref =
    persona === 'merchant' ? '/signup?role=merchant'
    : persona === 'instructor' ? '/signup?role=instructor'
    : '/signup?role=customer'

  // Auto-rotate videos with smooth transitions (3 seconds per video)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Videos with Smooth Transition */}
      {HERO_VIDEOS.map((videoSrc, index) => (
        <video
          key={index}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
          {/* Fallback for this specific video */}
        </video>
      ))}

      {/* Video Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {HERO_VIDEOS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentVideoIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentVideoIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            ✨ Join 50,000+ fitness enthusiasts
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
          Train. Book.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Thryve.
          </span>
        </h1>
        
        <p className="mt-6 text-lg/7 opacity-90 text-white mb-6 max-w-2xl mx-auto leading-relaxed">{SUBHEAD}</p>

        {/* Persona pills */}
        <div className="mt-6 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/30 backdrop-blur">
          {PERSONAS.map(p => (
            <button
              key={p.value}
              onClick={() => setPersona(p.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${persona === p.value ? 'bg-white text-gray-900' : 'text-white/90 hover:bg-white/10'}`}
              aria-pressed={persona === p.value}
            >
              {p.label}
            </button>
          ))}
        </div>
        
        {/* CTAs */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href={primaryHref} className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-gray-900 hover:bg-gray-100" aria-label="Start Your Journey">
            Start Your Journey
          </a>
          <a href="/pricing" className="inline-flex rounded-full bg-white/10 px-6 py-3 font-semibold ring-1 ring-white/40 hover:bg-white/20" aria-label="See Plans">
            See Plans
          </a>
        </div>

        {/* Badges */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          {BADGES.map(b => (
            <li key={b} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/30 backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {b}
            </li>
          ))}
        </ul>
        
        <div className="mt-16 text-white/70 text-sm">
          <p>Join thousands of studios and fitness enthusiasts worldwide</p>
        </div>
      </div>
    </div>
  )
}