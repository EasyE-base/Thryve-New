'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

// ✅ EXTRACTED: Call-to-action section
export default function CTASection() {
  return (
    <section className="py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M9 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM21 15a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM33 27a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM45 39a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM57 51a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM69 63a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM81 75a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM93 87a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM105 99a6 6 0 1 0 0 12 6 6 0 0 0 0-12z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
          animation: 'float 20s linear infinite'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-8">
            <Zap className="h-4 w-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">
              Ready to Transform Your Fitness Journey?
            </span>
          </div>
          
          {/* Heading */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Start Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300">
              Thryve
            </span>{' '}
            Journey
          </h2>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-12 font-medium">
            Join thousands of fitness enthusiasts and studio owners who've revolutionized their fitness experience with Thryve
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-white/90 px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            
            <Link href="/marketplace">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white/50 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/70 px-12 py-6 rounded-2xl text-xl font-bold transition-all duration-300 hover:scale-105"
              >
                Browse Classes
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Free to join</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>50K+ satisfied users</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}