'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Check, Star, Zap, Crown } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Browse unlimited classes",
        "Basic profile creation",
        "Community access",
        "Mobile app access",
        "Email support"
      ],
      badge: null,
      gradient: "from-gray-400 to-gray-600",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Most popular for active users",
      features: [
        "Everything in Free",
        "Book unlimited classes",
        "Premium class access",
        "Advanced analytics",
        "Priority support",
        "Instructor messaging",
        "Early access to new features"
      ],
      badge: "Most Popular",
      gradient: "from-blue-400 to-blue-600",
      popular: true
    },
    {
      name: "Studio",
      price: "$99",
      period: "/month",
      description: "Complete solution for studios",
      features: [
        "Everything in Pro",
        "Unlimited instructor accounts",
        "Advanced studio management",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "White-label options",
        "Advanced reporting"
      ],
      badge: "Best Value",
      gradient: "from-purple-400 to-purple-600",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Thryve</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/about">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  About
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  Home
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-tight mb-8">
              Simple
              <span className="block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect plan for your fitness journey. Upgrade or downgrade at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`relative bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
                  plan.popular ? 'scale-105 ring-2 ring-blue-400/50' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={`bg-gradient-to-r ${plan.gradient} text-white border-0 px-6 py-2`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {index === 0 && <Zap className="h-8 w-8 text-white" />}
                    {index === 1 && <Star className="h-8 w-8 text-white" />}
                    {index === 2 && <Crown className="h-8 w-8 text-white" />}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-blue-200">{plan.period}</span>
                  </div>
                  
                  <p className="text-blue-200">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-white/90">
                        <Check className="h-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/">
                    <Button 
                      className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white border-0 font-semibold py-3 transition-all duration-300`}
                    >
                      {plan.price === "$0" ? "Get Started Free" : "Start Free Trial"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "Can I switch plans anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "Is there a free trial?",
                answer: "We offer a 14-day free trial for all paid plans. No credit card required to start."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise plans."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Absolutely! Cancel your subscription anytime with no cancellation fees or penalties."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-200">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Transform Your Fitness?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Start your free trial today and discover why thousands choose Thryve for their fitness journey.
            </p>
            <Link href="/">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 px-12 py-4 text-xl font-semibold rounded-xl"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}