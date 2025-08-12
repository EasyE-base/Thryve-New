'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Shield, Rocket, BarChart3, Layers, Zap, CheckCircle2, Star } from 'lucide-react'
import Link from 'next/link'
import SignInModal from '@/components/landing/SignInModal'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Client-only mounting to prevent SSR/hydration mismatch
  useEffect(() => setMounted(true), [])

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
        <div className="absolute inset-0 bg-black/50" />
        {/* Gradient glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/30 via-fuchsia-500/20 to-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              Build your
              <span className="mx-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white"> signup journey</span>
              with clarity and speed
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Modern onboarding that converts, scales, and looks amazing.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg shadow-black/20 ring-1 ring-black/5">
                  Start for free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-lg rounded-xl">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Strip */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-6">
            <p className="text-sm uppercase tracking-wider text-gray-500">Trusted by modern teams</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 items-center opacity-70">
            {['Arcadia','Summit','Pulse','Northstar','Cascade','Vertex'].map((logo) => (
              <div key={logo} className="text-center text-gray-400 font-semibold text-sm">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-gray-50">
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
              <div key={i} className="bg-white/70 backdrop-blur rounded-2xl border border-gray-100 p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold mb-4">{i+1}</div>
                <h3 className="text-xl font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why teams choose Thryve</h2>
            <p className="mt-3 text-gray-600">Conversion-first design with scalable architecture.</p>
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
              <div key={i} className="rounded-2xl border border-gray-100 p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-indigo-50 p-2">{b.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{b.t}</h3>
                <p className="mt-2 text-gray-600">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Loved by studios and instructors</h2>
            <p className="mt-3 text-gray-600">Real teams shipping better onboarding experiences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {q:'“The merchant flow finally just works. We launched in a day.”', a:'Studio Owner'},
              {q:'“Clean UI, clear steps, less support tickets.”', a:'Instructor'},
              {q:'“Fast signup and I was booking classes instantly.”', a:'Customer'}
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-500 mb-4">
                  {Array.from({length:5}).map((_,idx)=> (
                    <Star key={idx} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-900 text-lg leading-relaxed">{t.q}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <p className="text-gray-500 text-sm">{t.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple pricing</h2>
            <p className="mt-3 text-gray-600">Start free. Upgrade when you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {name:'Starter', price:'Free', features:['Email signup','Role selection','Basic dashboards'], cta:'Start for free', primary:false},
              {name:'Growth', price:'$49/mo', features:['All Starter','Studio tools','Instructor payouts'], cta:'Choose Growth', primary:true},
              {name:'Scale', price:'$149/mo', features:['All Growth','Advanced analytics','Priority support'], cta:'Choose Scale', primary:false}
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border ${p.primary ? 'border-indigo-200 shadow-xl ring-1 ring-indigo-100' : 'border-gray-100'} p-8 bg-white` }>
                <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                <div className="mt-2 text-4xl font-extrabold text-gray-900">{p.price}</div>
                <ul className="mt-6 space-y-2 text-gray-600">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/pricing">
                  <Button className={`mt-8 w-full rounded-xl ${p.primary ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}>{p.cta}</Button>
                </Link>
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
          <Accordion type="single" collapsible className="bg-white rounded-xl border border-gray-100">
            {[
              {q:'Can I use a .mov for the hero?', a:'Yes, but for the web we serve MP4 and WEBM with a poster. MOV is not recommended for production.'},
              {q:'Does the dashboard show real data?', a:'Yes. We removed mock data and return Firestore results or empty states.'},
              {q:'Is the onboarding role-aware?', a:'Yes. Role is persisted and redirects are enforced for correct flows.'}
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
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