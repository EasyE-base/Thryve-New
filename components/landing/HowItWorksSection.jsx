'use client'

import { CheckCircle } from 'lucide-react'

// ✅ EXTRACTED: How It Works section
export default function HowItWorksSection() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-100/50 mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 text-sm font-bold">
              ⚡ How It Works
            </span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
            Get Started in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              3 Steps
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of fitness enthusiasts who've simplified their workout routine with Thryve
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🔍</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Discover Classes
                </h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Browse hundreds of classes from top-rated studios in your area using our intelligent search
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💳</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                  Book Instantly
                </h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Secure your spot with one click, complete with secure payment processing
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💪</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  Show Up & Thrive
                </h4>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Focus on your workout while we handle the rest of your fitness journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}