'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check, Star, BarChart3, Users, Calendar, Settings, 
  Shield, Zap, Crown, Building2, ArrowRight, ChevronDown,
  Sparkles, TrendingUp, Award, Target
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function PricingPage() {
  const { user } = useAuth()
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      originalPrice: null,
      period: 'mo',
      description: 'Core scheduling, payments, class packs, dashboard tools',
      features: [
        'Class scheduling & booking engine',
        'Basic payment processing',
        'Class pack management',
        'Customer database',
        'Mobile app access',
        'Email support',
        'Basic analytics',
        'Staff management (up to 3)'
      ],
      popular: false,
      cta: 'Get Started',
      badge: null,
      color: 'emerald'
    },
    {
      id: 'business',
      name: 'Business+',
      price: 59,
      originalPrice: null,
      period: 'mo',
      description: 'Advanced analytics, loyalty system, staff tools',
      features: [
        'Everything in Starter',
        'Advanced analytics & reporting',
        'Customer loyalty system',
        'Automated marketing campaigns',
        'Staff scheduling tools',
        'X Pass participation eligibility',
        'Priority customer support',
        'Custom branding options',
        'Unlimited staff accounts',
        'API access'
      ],
      popular: true,
      cta: 'Get Started',
      badge: 'Most Popular',
      color: 'emerald'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom Quote',
      originalPrice: null,
      period: '',
      description: 'Custom integrations, multi-location management, VIP onboarding',
      features: [
        'Everything in Business+',
        'Multi-location management',
        'Custom integrations & APIs',
        'White-label solutions',
        'Dedicated account manager',
        'VIP onboarding & migration',
        'Custom reporting dashboards',
        'Advanced security features',
        'SLA guarantees',
        'Custom feature development'
      ],
      popular: false,
      cta: 'Contact Sales',
      badge: null,
      color: 'emerald'
    }
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'You scale only as you grow',
      description: 'Our pricing grows with your business - no upfront costs'
    },
    {
      icon: Target,
      title: 'Predictable costs—no surprise billing',
      description: 'Transparent monthly fee + flat 3.75% booking fee'
    },
    {
      icon: Shield,
      title: 'Full control of your branding, data, and customers',
      description: 'Keep your brand identity and customer relationships'
    }
  ]

  const faqData = [
    {
      question: 'What\'s included in each plan?',
      answer: 'Each plan builds upon the previous tier. Starter includes core booking and payment tools, Business+ adds advanced analytics and marketing features, while Enterprise provides custom solutions for larger operations.'
    },
    {
      question: 'How does the 3.75% transaction fee work?',
      answer: 'We charge a flat 3.75% fee on all successful bookings processed through Thryve. This covers payment processing, platform maintenance, and customer support. No hidden fees or surprise charges.'
    },
    {
      question: 'Do I need both a subscription and X Pass?',
      answer: 'Your studio subscription gives you access to the Thryve platform tools. X Pass is an optional marketplace program that your customers can purchase to book classes across participating studios. You need a subscription to participate in X Pass.'
    },
    {
      question: 'What support is included?',
      answer: 'All plans include email support. Business+ and Enterprise plans get priority support with faster response times. Enterprise customers also receive a dedicated account manager.'
    },
    {
      question: 'Can I switch plans anytime?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle, and we\'ll prorate any differences.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for Starter and Business+ plans. Enterprise customers receive complimentary VIP onboarding and migration assistance.'
    }
  ]

  const handleGetStarted = (planId) => {
    if (!user) {
      toast.info('Sign up to get started with Thryve!')
      window.location.href = '/signup?plan=' + planId
      return
    }
    toast.success(`Let's set up your ${planId} plan!`)
  }

  const handleContactSales = () => {
    toast.info('Redirecting to sales team...')
    window.location.href = '/contact?type=enterprise'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sage-Green Accent Stripe */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Thryve</h1>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/explore" className="text-gray-600 hover:text-emerald-600 transition-colors">Explore</Link>
              <Link href="/studios" className="text-gray-600 hover:text-emerald-600 transition-colors">Studios</Link>
              <Link href="/xpass" className="text-gray-600 hover:text-emerald-600 transition-colors">X Pass</Link>
              <Link href="/pricing" className="text-emerald-600 font-medium">Pricing</Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-emerald-600">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Plans for Studios
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Access all the tools, keep your brand, grow your business.
          </p>
        </div>
      </section>

      {/* Studio Subscription Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Studio Subscription Plans</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Every studio that wants to manage booking, staff, schedules, and payouts on Thryve needs a monthly subscription.
            </p>
            <div className="bg-emerald-50 rounded-2xl p-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans are built for transparency:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <span className="text-gray-700">Monthly tier fee (Starter, Business+, Enterprise)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <span className="text-gray-700">Flat 3.75% booking fee on sales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.popular ? 'ring-2 ring-emerald-500 transform scale-105' : 'hover:shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-white text-center py-2 text-sm font-medium">
                    {plan.badge}
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-8'} pb-4`}>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    {typeof plan.price === 'string' ? (
                      <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                    ) : (
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-1">/{plan.period}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => plan.id === 'enterprise' ? handleContactSales() : handleGetStarted(plan.id)}
                    className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'} py-3 rounded-xl font-medium transition-all duration-300`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Pricing Structure Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why This Pricing Structure Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                    <benefit.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* X Pass vs Studio Pricing Explanation */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                What's the difference between Studio Prices and X Pass?
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-xl leading-relaxed mb-6">
                  <strong>Studio pricing</strong> powers your backend and tools. <strong>X Pass</strong> is a marketplace 
                  credit system purchased by clients to book at participating studios. You need a Studio subscription to opt into X Pass.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white rounded-lg p-6 border border-emerald-200">
                    <h3 className="text-lg font-semibold text-emerald-700 mb-3">Studio Subscription (You Pay)</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Monthly platform access</li>
                      <li>• Tools & dashboard</li>
                      <li>• Keep your brand & data</li>
                      <li>• 3.75% booking fee</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 border border-emerald-200">
                    <h3 className="text-lg font-semibold text-emerald-700 mb-3">X Pass (Customers Pay)</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Class credits for customers</li>
                      <li>• Cross-studio booking</li>
                      <li>• 5-10% marketplace fee</li>
                      <li>• Optional participation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about studio pricing</p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card key={index} className="border-emerald-200">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedFaq === index ? 'transform rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Grow Your Studio?</h2>
          <p className="text-xl text-emerald-100 mb-8">Join hundreds of studios already using Thryve to manage and grow their business</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => handleGetStarted('starter')}
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </Button>
            <Button 
              onClick={handleContactSales}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 rounded-full transition-all duration-300"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">Thryve</h3>
              <p className="text-gray-400">Powering the future of fitness studios.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/explore" className="hover:text-emerald-400 transition-colors">Explore Classes</Link></li>
                <li><Link href="/studios" className="hover:text-emerald-400 transition-colors">For Studios</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Sales</Link></li>
                <li><Link href="/api" className="hover:text-emerald-400 transition-colors">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-emerald-400 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Thryve. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}