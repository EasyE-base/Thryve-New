'use client'

import { useState, useEffect } from 'react'

// ✅ EXTRACTED: Testimonials section with carousel
const INSTRUCTOR_IMAGE = "https://images.unsplash.com/photo-1616279969096-54b228f5f103?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxmaXRuZXNzJTIwaW5zdHJ1Y3RvcnxlbnwwfHx8fDE3NTM3Mzk2NzB8MA&ixlib=rb-4.1.0&q=85"

const TESTIMONIALS = [
  {
    quote: "Thryve completely transformed how I manage my studio. The AI onboarding was seamless.",
    name: "Elena Rodriguez",
    title: "Owner, Luna Yoga Studio",
    image: INSTRUCTOR_IMAGE
  },
  {
    quote: "Finally, a platform that puts studios first. The 3.75% fee is unbeatable.",
    name: "Michael Chen",
    title: "Founder, Peak Performance",
    image: INSTRUCTOR_IMAGE
  },
  {
    quote: "My clients love the X Pass. It's brought so much more foot traffic to my classes.",
    name: "Sophia Martinez",
    title: "Pilates Instructor",
    image: INSTRUCTOR_IMAGE
  }
]

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.2'%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='100' cy='100' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-full border border-orange-100/50 mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 text-sm font-bold">
              💬 Studio Success Stories
            </span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
            What Studios{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-pink-600 to-rose-600">
              Say
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Real stories from real studio owners who've transformed their business with Thryve
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-pink-600 to-rose-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            
            <div className="relative p-12 md:p-16 bg-white rounded-3xl shadow-2xl border border-slate-100">
              <div className="text-center">
                {/* Quote Icon */}
                <div className="mb-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                </div>

                {/* Avatar */}
                <div className="mb-8">
                  <div className="relative inline-block">
                    <img 
                      src={TESTIMONIALS[currentTestimonial].image} 
                      alt={TESTIMONIALS[currentTestimonial].name}
                      className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-gradient-to-r from-orange-200 to-pink-200"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-3xl md:text-4xl text-slate-800 mb-8 leading-relaxed font-medium">
                  "{TESTIMONIALS[currentTestimonial].quote}"
                </blockquote>

                {/* Attribution */}
                <div className="text-center">
                  <div className="font-black text-2xl text-slate-900 mb-2">
                    {TESTIMONIALS[currentTestimonial].name}
                  </div>
                  <div className="text-lg text-slate-600 font-medium">
                    {TESTIMONIALS[currentTestimonial].title}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-4 mt-12">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 w-12' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}