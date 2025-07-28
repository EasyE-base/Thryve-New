'use client'

import Link from 'next/link'
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Users, 
  Settings, 
  CreditCard, 
  Calendar,
  Star,
  Search,
  ArrowRight,
  Mail,
  Phone,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HelpCenter() {
  const popularTopics = [
    {
      title: "Getting Started with Thryve",
      description: "Learn the basics of navigating the platform and setting up your account",
      icon: BookOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Managing Your Classes",
      description: "Create, schedule, and manage your fitness classes with ease",
      icon: Calendar,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Studio Onboarding Guide",
      description: "Complete guide for new studio owners to get up and running",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      title: "Understanding Thryve X Pass",
      description: "Multi-studio credit system for flexible class bookings",
      icon: CreditCard,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    },
    {
      title: "Payment & Billing",
      description: "Manage payments, subscriptions, and billing information",
      icon: CreditCard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20"
    },
    {
      title: "Account Settings",
      description: "Update your profile, preferences, and security settings",
      icon: Settings,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20"
    }
  ]

  const faqs = [
    {
      question: "How do I book a class?",
      answer: "Browse classes in the marketplace, select your preferred time slot, and click 'Book Now'. You'll receive a confirmation email with class details."
    },
    {
      question: "What is the cancellation policy?",
      answer: "You can cancel your booking up to 2 hours before the class starts for a full refund. Late cancellations may incur a no-show fee."
    },
    {
      question: "How does the Thryve X Pass work?",
      answer: "The X Pass gives you credits that can be used at any participating studio. Credits are flexible and don't expire for 12 months."
    },
    {
      question: "Can I reschedule my class?",
      answer: "Yes, you can reschedule your class up to 4 hours before the start time, subject to availability in your desired time slot."
    },
    {
      question: "How do I become a studio partner?",
      answer: "Visit our Studio Partner page and fill out the application. Our team will review your submission and contact you within 48 hours."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Help Center</h1>
            </div>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Find answers to common questions, explore guides, and get the support you need to make the most of Thryve
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-white/60" />
            <Input 
              type="text" 
              placeholder="Search for help articles, guides, or FAQs..." 
              className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Popular Topics</h2>
          <p className="text-blue-200 text-lg">Quick access to the most helpful resources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {popularTopics.map((topic, index) => {
            const Icon = topic.icon
            return (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${topic.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${topic.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {topic.title}
                      </h3>
                      <p className="text-blue-200 text-sm mb-3">{topic.description}</p>
                      <div className="flex items-center text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                        <span>Learn more</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-blue-200 text-lg">Quick answers to common questions</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
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

        {/* Contact Support */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center justify-center space-x-2">
                <MessageCircle className="h-6 w-6" />
                <span>Still Need Help?</span>
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Our support team is here to help you with any questions or issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1">Email Support</h3>
                  <p className="text-blue-200 text-sm mb-2">Get help via email</p>
                  <Link href="mailto:support@thryveapp.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                    support@thryveapp.com
                  </Link>
                </div>
                <div className="text-center">
                  <MessageCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1">Live Chat</h3>
                  <p className="text-blue-200 text-sm mb-2">Available during business hours</p>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                    Start Chat
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-blue-200">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Support Hours: Mon-Fri 9AM-6PM EST</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="text-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Thryve Home
          </Link>
        </div>
      </div>
    </div>
  )
}