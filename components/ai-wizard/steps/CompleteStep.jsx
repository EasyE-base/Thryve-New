'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Star, TrendingUp, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'

// ✅ EXTRACTED: Completion step with next actions
export default function CompleteStep({ studioData }) {
  const nextSteps = [
    {
      title: 'Set up your first classes',
      description: 'Create your initial class schedule and start accepting bookings',
      icon: Calendar,
      link: '/dashboard/merchant',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Customize your studio',
      description: 'Add photos, update policies, and personalize your studio profile',
      icon: Settings,
      link: '/business-settings',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'View analytics',
      description: 'Monitor your studio performance and track key metrics',
      icon: TrendingUp,
      link: '/dashboard/merchant',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">
          Welcome to Thryve, {studioData.studioName}! 🎉
        </h3>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Your studio has been successfully configured and is ready to accept bookings. 
          Here's what you can do next to get started.
        </p>
      </div>

      {/* Studio Summary */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400/30">
        <CardContent className="p-6">
          <h4 className="text-white font-bold text-lg mb-4">Your Studio Setup</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {studioData.studioType}
              </div>
              <div className="text-white/70 text-sm">Studio Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {studioData.location}
              </div>
              <div className="text-white/70 text-sm">Location</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {studioData.targetAudience}
              </div>
              <div className="text-white/70 text-sm">Target Audience</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div>
        <h4 className="text-white font-bold text-xl mb-6 text-center">
          What would you like to do next?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => (
            <Card key={index} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h5 className="text-white font-bold text-lg mb-2">{step.title}</h5>
                <p className="text-white/70 text-sm mb-4">{step.description}</p>
                <Link href={step.link}>
                  <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-none">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Success Stats */}
      <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-400/30">
        <CardContent className="p-6">
          <h4 className="text-white font-bold text-lg mb-4 text-center">You're All Set! 🚀</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
              <div className="text-white/70 text-sm">Studio Profile Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
              <div className="text-white/70 text-sm">Pricing Configured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
              <div className="text-white/70 text-sm">Policies Set</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
              <div className="text-white/70 text-sm">Ready for Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <Link href="/dashboard/merchant">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
        <p className="text-white/60 text-sm mt-4">
          You can always return to this wizard to make changes
        </p>
      </div>

      {/* Support */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
          <h5 className="text-white font-medium mb-2">Need Help Getting Started?</h5>
          <p className="text-white/70 text-sm mb-4">
            Our support team is here to help you succeed
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/help-center">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Help Center
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Contact Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}