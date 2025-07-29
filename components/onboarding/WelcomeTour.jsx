'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight, X, Play, Star, Zap, Users, Calendar, MessageSquare, Bell } from 'lucide-react'

export default function WelcomeTour({ isOpen, onClose, userRole }) {
  const [currentStep, setCurrentStep] = useState(0)

  const getTourSteps = (role) => {
    switch (role) {
      case 'customer':
        return [
          {
            title: "Welcome to Thryve! 🎉",
            description: "Your fitness journey starts here. Let's take a quick tour of what you can do.",
            icon: Star,
            highlights: ["Book classes instantly", "Track your progress", "Connect with instructors"]
          },
          {
            title: "Discover Classes",
            description: "Browse and book from thousands of fitness classes in your area.",
            icon: Calendar,
            highlights: ["Real-time availability", "Instant booking", "Waitlist options"]
          },
          {
            title: "Stay Connected",
            description: "Message instructors, get notifications, and join the community.",
            icon: MessageSquare,
            highlights: ["Direct messaging", "Class updates", "Community features"]
          },
          {
            title: "You're All Set!",
            description: "Start exploring classes and begin your fitness transformation.",
            icon: CheckCircle,
            highlights: ["Book your first class", "Set up notifications", "Explore X Pass"]
          }
        ]
      
      case 'instructor':
        return [
          {
            title: "Welcome, Instructor! 💪",
            description: "Ready to inspire and teach amazing students? Let's get you started.",
            icon: Users,
            highlights: ["Create your profile", "Manage your schedule", "Connect with students"]
          },
          {
            title: "Class Management",
            description: "Create, schedule, and manage your fitness classes with ease.",
            icon: Calendar,
            highlights: ["Easy class creation", "Flexible scheduling", "Capacity management"]
          },
          {
            title: "Student Communication",
            description: "Stay in touch with your students through messaging and notifications.",
            icon: MessageSquare,
            highlights: ["Direct student messaging", "Class announcements", "Feedback system"]
          },
          {
            title: "Earn & Grow",
            description: "Start teaching, earning, and building your fitness community.",
            icon: Zap,
            highlights: ["Instant payouts", "Student reviews", "Growing your following"]
          }
        ]
      
      case 'merchant':
        return [
          {
            title: "Welcome, Studio Owner! 🏢",
            description: "Transform your studio management with Thryve's powerful tools.",
            icon: Star,
            highlights: ["Manage your studio", "Handle staff & classes", "Track performance"]
          },
          {
            title: "Studio Management",
            description: "Complete control over your classes, instructors, and scheduling.",
            icon: Users,
            highlights: ["Staff management", "Class scheduling", "Resource allocation"]
          },
          {
            title: "Communication Hub",
            description: "Broadcast to members, manage messages, and send notifications.",
            icon: MessageSquare,
            highlights: ["Mass messaging", "Automated notifications", "Member communication"]
          },
          {
            title: "Analytics & Growth",
            description: "Track your studio's performance and grow your business.",
            icon: Zap,
            highlights: ["Revenue tracking", "Member analytics", "Growth insights"]
          }
        ]
      
      default:
        return []
    }
  }

  const tourSteps = getTourSteps(userRole)
  const currentStepData = tourSteps[currentStep] || {}
  const IconComponent = currentStepData.icon || Star

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const skipTour = () => {
    onClose()
  }

  if (!isOpen || !tourSteps.length) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={skipTour}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          
          <CardTitle className="text-2xl text-gray-900">
            {currentStepData.title}
          </CardTitle>
          
          <CardDescription className="text-gray-600 mt-2">
            {currentStepData.description}
          </CardDescription>
          
          <div className="flex justify-center space-x-2 mt-4">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-[#1E90FF] w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {currentStepData.highlights?.map((highlight, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{highlight}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="ghost"
              onClick={skipTour}
              className="text-gray-500"
            >
              Skip Tour
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {tourSteps.length}
              </span>
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-[#1E90FF] to-[#4A90E2] hover:from-[#1976D2] hover:to-[#1976D2] text-white"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Get Started
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}