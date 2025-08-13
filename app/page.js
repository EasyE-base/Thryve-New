'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Shield, Rocket, BarChart3, Layers, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import SignInModal from '@/components/landing/SignInModal'
import ZipSearchBar from '@/components/home/ZipSearchBar'
import PopularCities from '@/components/home/PopularCities'
import ClassesFeed from '@/components/home/feeds/ClassesFeed'
import JobsFeed from '@/components/home/feeds/JobsFeed'
import { useHomeLocation } from '@/hooks/useHomeLocation'

export default function HomePage() {
  const { user, loading, role } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showFloatingCta, setShowFloatingCta] = useState(false)
  // Segment state: 'studios' | 'instructors' | 'members'
  const [segment, setSegment] = useState('studios')
  const { location, setZip, useMyLocation } = useHomeLocation()
  const zipToolbarRef = useRef(null)
  const phrases = [
    'big thing',
    'store they line up for',
    'one to watch',
    'category creator',
    'household name',
    'global empire'
  ]
  const [phraseIndex, setPhraseIndex] = useState(0)

  // Client-only mounting to prevent SSR/hydration mismatch
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => {
      const trigger = Math.min(window.innerHeight * 0.6, 600)
      setShowFloatingCta(window.scrollY > trigger)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Initialize segment from query or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const segParam = params.get('segment')
    const stored = window.localStorage.getItem('thryve_segment')
    const initial = (segParam || stored || 'studios')
    setSegment(['studios','instructors','members'].includes(initial) ? initial : 'studios')
  }, [])

  // dataLayer stub
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.dataLayer = window.dataLayer || []
  }, [])

  const trackEvent = (event, payload) => {
    if (typeof window === 'undefined') return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...payload })
  }

  const handleSegmentChange = (next) => {
    setSegment(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('thryve_segment', next)
      const url = new URL(window.location.href)
      url.searchParams.set('segment', next)
      window.history.replaceState({}, '', url.toString())
    }
    trackEvent('segment_view', { segment: next })
  }

  const onCtaClick = (loc, dest) => {
    trackEvent('cta_click', { segment, label: 'cta', dest })
  }

  const heroCopy = {
    studios: {
      headline: 'Launch and grow your studio. Bookings, payouts, analytics—done.',
      sub: 'Powerful tools to manage classes, payouts via Stripe, and growth analytics.',
    },
    instructors: {
      headline: 'Find work you love. Get hired by studios nearby.',
      sub: 'Browse open jobs, create a free profile, and get paid on time.',
    },
    members: {
      headline: 'Classes near you. Book in seconds.',
      sub: 'Discover studios, claim 10% off your first class, and join the ThryveX network.',
    },
  }

  // Expose auth state for feed click guards
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__isAuthed = !!user
      window.__role = role || null
    }
  }, [user])

  const benefitsByPersona = {
    'studio-owner': [
      'Automated payouts via Stripe',
      'Real-time capacity & bookings',
      'Hire and schedule instructors fast',
    ],
    instructor: [
      'Set rates & availability',
      'Get hired by vetted studios',
      'Guaranteed payouts after sessions',
    ],
    customer: [
      'Nearby classes that fit your schedule',
      'One-tap checkout',
      'Track favorites & history',
    ],
  }

  const stepsByPersona = {
    'studio-owner': ['Create studio', 'Publish classes', 'Get paid (Stripe)'],
    instructor: ['Create profile', 'Set availability', 'Accept bookings'],
    customer: ['Pick class', 'Pay / Use X Pass', 'Check-in'],
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">Thryve</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 hidden sm:inline">Welcome, {user.email}</span>
                  <Link href="/dashboard/merchant">
                    <Button className="bg-gray-900 hover:bg-black text-white">Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSignInModal(true)}
                  >
                    Sign In
                  </Button>
                  <Link href="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - full-bleed background video */}
      <section className="relative min-h-[80vh] md:min-h-screen overflow-hidden bg-black">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero-poster.jpg"
        >
          <source src="/hero.webm" type="video/webm" />
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/65" />
        {/* Subtle grid overlay */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px]" />
        {/* Gradient glows with motion */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/30 via-fuchsia-500/20 to-cyan-500/10 blur-3xl animate-float-slow" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 blur-3xl animate-float-slower" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="text-center">
            <div className="min-h-[4.5rem] md:min-h-[6rem] lg:min-h-[6rem] flex items-center justify-center">
              <h1 className="text-3xl md:text-6xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">{heroCopy[segment].headline}</h1>
            </div>
            {/* Persona switcher */}
            <div className="mt-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur p-1 text-white">
              {[
                { id: 'studios', label: 'Studios' },
                { id: 'instructors', label: 'Instructors' },
                { id: 'members', label: 'Members' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSegmentChange(p.id)}
                  className={`w-28 px-4 py-1.5 rounded-full text-sm font-medium transition ${segment === p.id ? 'bg-white text-gray-900' : 'text-white'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-6 min-h-[2.75rem] md:min-h-[3.25rem] flex items-center justify-center">
              <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto text-pretty">
              {heroCopy[segment].sub}
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center min-h-[48px] md:min-h-[48px]">
              {segment === 'studios' && (
                <>
                  <Link href="/signup?role=merchant" onClick={() => onCtaClick('hero', '/signup?role=merchant')} className="inline-flex">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium shadow-lg shadow-black/20 ring-1 ring-black/5 min-w-[220px] text-center">Start Your Journey</span>
                  </Link>
                  <Link href="/pricing" onClick={() => onCtaClick('hero', '/pricing')} className="inline-flex">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium ring-1 ring-black/5 min-w-[220px] text-center">See Plans</span>
                  </Link>
                </>
              )}
              {segment === 'instructors' && (
                <>
                  <button
                    onClick={() => {
                      onCtaClick('hero', 'jobs_near_me')
                      if (zipToolbarRef.current) zipToolbarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium shadow-lg shadow-black/20 ring-1 ring-black/5 min-w-[220px]"
                  >
                    Find jobs near me
                  </button>
                  <Link href="/signup?role=instructor" onClick={() => onCtaClick('hero', '/signup?role=instructor')} className="inline-flex">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium ring-1 ring-black/5 min-w-[220px] text-center">Create your free profile</span>
                  </Link>
                </>
              )}
              {segment === 'members' && (
                <>
                  <button
                    onClick={() => {
                      onCtaClick('hero', 'classes_near_me')
                      if (zipToolbarRef.current) zipToolbarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium shadow-lg shadow-black/20 ring-1 ring-black/5 min-w-[220px]"
                  >
                    See classes near me
                  </button>
                  <Link href="/signup?role=customer" onClick={() => onCtaClick('hero', '/signup?role=customer')} className="inline-flex">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-medium ring-1 ring-black/5 min-w-[220px] text-center">Get 10% off</span>
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-white/70 text-sm">
              {segment === 'studios' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />5 Min Setup</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Sync From Other Platforms</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Payouts Daily</div>
                </>
              )}
              {segment === 'instructors' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Find Jobs Near You</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Set Your Own Rates</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Get Paid on Time</div>
                </>
              )}
              {segment === 'members' && (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Discover Classes Nearby</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Save With ThryveX</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Book in One Tap</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-3 py-1 backdrop-blur text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />10% off your first class</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ZIP toolbar and feeds for instructors/members */}
      {(segment === 'instructors' || segment === 'members') && (
        <section ref={zipToolbarRef} className="bg-gray-900 text-white py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ZipSearchBar
              onSubmit={async (zip) => {
                const loc = await setZip(zip)
                if (loc) {
                  trackEvent('zip_set', { zip: loc.zip, lat: loc.lat, lng: loc.lng, method: 'manual' })
                }
              }}
              onUseLocation={() => {
                useMyLocation()
                trackEvent('zip_set', { zip: '', lat: 0, lng: 0, method: 'geo' })
              }}
            />
            {!location && (
              <PopularCities onSelect={async (c) => {
                const loc = await setZip(c.zip)
                if (loc) trackEvent('zip_set', { zip: loc.zip, lat: loc.lat, lng: loc.lng, method: 'city_click' })
              }} />
            )}
          </div>
        </section>
      )}

      {segment === 'members' && location && (
        <section id="classes" className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Classes near you</h2>
            <div className="mt-6 flex justify-center">
              <div className="w-full">
                <ClassesFeed lat={location.lat} lng={location.lng} radius={25} />
              </div>
            </div>
          </div>
        </section>
      )}

      {segment === 'instructors' && location && (
        <section id="jobs" className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">Studios hiring near you</h2>
            <JobsFeed lat={location.lat} lng={location.lng} radius={25} />
          </div>
        </section>
      )}

      {/* Floating CTA */}
      {showFloatingCta && (
        <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
          <div className="max-w-3xl w-full rounded-2xl bg-white/85 backdrop-blur border border-gray-200 shadow-lg ring-1 ring-black/5 p-4 flex items-center justify-between gap-3">
            <div className="text-sm md:text-base text-gray-700">
              Ready to launch? <span className="font-semibold text-gray-900">Start for free</span> in minutes.
            </div>
            <Link href="/signup">
              <Button className="rounded-xl bg-gray-900 hover:bg-black text-white">Start for free</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Removed brands strip per policy */}

      {/* Global animation helpers (scoped here) */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
        @keyframes float-slow {
          0% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -10px) scale(1.02); }
          100% { transform: translate(-50%, 0) scale(1); }
        }
        @keyframes float-slower {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(0, -8px) scale(1.015); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 14s ease-in-out infinite; }
        /* Temporarily disable reveal animations to ensure full visibility */
        .reveal-up { opacity: 1 !important; transform: none !important; }
      `}</style>

      {/* Steps (persona-specific) */}
      <section className="py-20 bg-gray-50" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Get started in minutes</h2>
            <p className="mt-3 text-gray-600">A simple, clear flow from signup to live onboarding.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {title:'Create your account', desc:'Start for free with email or Google.'},
              {title:'Customize your journey', desc:'Pick role and complete the guided steps.'},
              {title:'Launch and grow', desc:'Go live with dashboards and real-time data.'}
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm reveal-up" style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold mb-4">{i+1}</div>
                <h3 className="text-xl font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-gray-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits (persona-specific) */}
      <section className="py-20 bg-white" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why teams choose Thryve</h2>
            <p className="mt-3 text-gray-700">Conversion-first design with scalable architecture.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {icon: <Zap className="h-6 w-6 text-indigo-600" />, t:'Frictionless signup', d:'Optimized for mobile and desktop with best practices.'},
              {icon: <Layers className="h-6 w-6 text-indigo-600" />, t:'Role-based onboarding', d:'Tailored flows for studios, instructors, and customers.'},
              {icon: <Shield className="h-6 w-6 text-indigo-600" />, t:'Secure by default', d:'Hardened Firebase rules and server verification.'},
              {icon: <BarChart3 className="h-6 w-6 text-indigo-600" />, t:'Real data, no mocks', d:'Dashboards show live Firestore data with empty states.'},
              {icon: <Rocket className="h-6 w-6 text-indigo-600" />, t:'Fast redirects', d:'Robust role persistence and guard logic.'},
              {icon: <CheckCircle2 className="h-6 w-6 text-indigo-600" />, t:'Production-ready', d:'CI-friendly, Vercel-ready, and tested E2E.'}
            ].map((b, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 p-8 bg-white shadow-sm hover:shadow-md transition-shadow reveal-up" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-indigo-50 p-2">{b.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{b.t}</h3>
                <p className="mt-2 text-gray-700">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Pricing (per role) */}
      <section id="pricing" className="py-20 bg-white" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple pricing</h2>
            <p className="mt-3 text-gray-700">Pricing for each role — Studios, Instructors, and Members (X Pass).</p>
          </div>

          {/* Studios */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Studios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            {[
              {name:'Starter', price:'$29/mo', features:['Bookings & schedule','Stripe payouts','Basic analytics'], primary:false},
              {name:'Business+', price:'$59/mo', features:['Everything in Starter','Hiring & scheduling','Advanced analytics'], primary:true},
              {name:'Enterprise', price:'Custom', features:['Custom SLAs','Dedicated support','Advanced controls'], primary:false}
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border ${p.primary ? 'border-indigo-200 shadow-xl ring-1 ring-indigo-100' : 'border-gray-200'} p-8 bg-white`}>
                <h4 className="text-xl font-bold text-gray-900">{p.name}</h4>
                <div className="mt-2 text-4xl font-extrabold text-gray-900">{p.price}</div>
                <ul className="mt-6 space-y-2 text-gray-700">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />{f}</li>
                  ))}
                </ul>
                <Link href="/signup?role=merchant">
                  <Button className={`mt-8 w-full rounded-xl ${p.primary ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}>Start free</Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-700 mb-10">+ 3.75% platform fee per customer transaction.</p>

          {/* Programs subsection */}
          <div className="rounded-2xl border border-gray-200 p-6 md:p-8 bg-gray-50 mb-16">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Optional programs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
              <div>
                <div className="font-semibold">Member Plus</div>
                <p>Cross-studio class packs, 5% per booking (only when redeemed).</p>
              </div>
              <div>
                <div className="font-semibold">Thryve X Pass</div>
                <p>Monthly credits across studios, 8% per redemption by default (configurable 5–10%).</p>
              </div>
            </div>
          </div>

          {/* Instructors */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Instructors</h3>
          <div className="rounded-2xl border border-gray-200 p-8 bg-white text-center mb-16">
            <p className="text-gray-800">Free to join. Marketplace (optional): 7% per marketplace-sourced session, capped at $12. $0 for home-studio/direct assignments.</p>
            <div className="mt-6">
              <Link href="/signup?role=instructor">
                <Button className="rounded-xl bg-gray-900 hover:bg-black text-white">Join as instructor</Button>
              </Link>
            </div>
          </div>

          {/* Members (X Pass) */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Members (X Pass)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {name:'Lite', price:'$39/mo', credits:'4 credits'},
              {name:'Core', price:'$79/mo', credits:'8 credits'},
              {name:'Pro', price:'$119/mo', credits:'12 credits'},
            ].map((p, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 p-8 bg-white text-center">
                <h4 className="text-xl font-bold text-gray-900">{p.name}</h4>
                <div className="mt-2 text-3xl font-extrabold text-gray-900">{p.price}</div>
                <p className="mt-2 text-gray-800">{p.credits}</p>
                <p className="mt-4 text-sm text-gray-700">Rollover up to one month’s worth; cancel anytime; no-show/late cancel forfeits credit (studio fee may apply).</p>
                <div className="mt-6">
                  <Link href="/signup?role=customer">
                    <Button className="rounded-xl bg-gray-900 hover:bg-black text-white">Get started</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="bg-white rounded-xl border border-gray-100" data-animate>
            {[
              {q:'Can I use a .mov for the hero?', a:'Yes, but for the web we serve MP4 and WEBM with a poster. MOV is not recommended for production.'},
              {q:'Does the dashboard show real data?', a:'Yes. We removed mock data and return Firestore results or empty states.'},
              {q:'Is the onboarding role-aware?', a:'Yes. Role is persisted and redirects are enforced for correct flows.'}
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="reveal-up" style={{ transitionDelay: `${i * 50}ms` }}>
                <AccordionTrigger className="px-6">{f.q}</AccordionTrigger>
                <AccordionContent className="px-6 text-gray-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Built specifically for fitness studios with features that save time and increase revenue.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Class Management", description: "Schedule classes and manage instructors", icon: "📅" },
              { title: "Online Booking", description: "Let clients book classes anytime", icon: "📱" },
              { title: "Payment Processing", description: "Secure payments with competitive rates", icon: "💳" }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Studios Powered", value: "500+" },
              { label: "Classes Booked", value: "50K+" },
              { label: "Happy Clients", value: "25K+" },
              { label: "Revenue Processed", value: "$2M+" }
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Studio?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of studio owners who have grown their business with Thryve.</p>
          {user ? (
            <Link href="/dashboard/merchant">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                Start Your Free Trial
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Thryve</h3>
              <p className="text-gray-400">The complete fitness studio management platform.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Thryve. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
    </div>
  )
}