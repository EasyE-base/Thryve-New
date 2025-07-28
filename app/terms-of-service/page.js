'use client'

import Link from 'next/link'
import { 
  FileText, 
  Scale, 
  AlertTriangle, 
  CreditCard, 
  Shield, 
  Users, 
  Ban,
  CheckCircle,
  Clock,
  Mail,
  Gavel,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TermsOfService() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle,
      color: "text-green-400",
      content: [
        "By accessing or using the Thryve platform, you agree to be bound by these Terms of Service",
        "If you disagree with any part of these terms, you may not access or use our service",
        "These terms apply to all users including visitors, customers, instructors, and studio owners",
        "You must be at least 18 years old to use our service",
        "By using our service, you represent that you have the legal capacity to enter into these terms"
      ]
    },
    {
      title: "User Accounts",
      icon: Users,
      color: "text-blue-400",
      content: [
        "You are responsible for maintaining the security of your account and password",
        "You must provide accurate and complete information when creating an account",
        "You are responsible for all activities that occur under your account",
        "You must notify us immediately of any unauthorized use of your account",
        "We reserve the right to suspend or terminate accounts that violate these terms",
        "One person may not maintain multiple accounts without our permission"
      ]
    },
    {
      title: "Class Bookings & Cancellations",
      icon: Clock,
      color: "text-purple-400",
      content: [
        "Class bookings are subject to availability and studio policies",
        "Cancellations must be made according to each studio's cancellation policy",
        "No-show fees may apply if you don't attend a booked class",
        "Credits and refunds are subject to individual studio policies",
        "Class schedules may change - you'll be notified of any changes",
        "You may be placed on a waitlist if a class is full"
      ]
    },
    {
      title: "Payments & Billing",
      icon: CreditCard,
      color: "text-yellow-400",
      content: [
        "All payments are processed securely through our payment partners",
        "You authorize us to charge your selected payment method",
        "Prices are subject to change with reasonable notice",
        "Refunds are handled according to our refund policy and applicable laws",
        "You are responsible for any taxes associated with your purchases",
        "Disputed charges should be reported to us within 30 days"
      ]
    },
    {
      title: "Studio Owner Responsibilities",
      icon: Scale,
      color: "text-red-400",
      content: [
        "Studio owners must provide accurate class information and schedules",
        "You are responsible for the quality and safety of your classes",
        "You must maintain appropriate insurance coverage",
        "You agree to our commission structure and payment terms",
        "You must comply with all local health and safety regulations",
        "You are responsible for managing your instructor relationships"
      ]
    },
    {
      title: "Prohibited Activities",
      icon: Ban,
      color: "text-orange-400",
      content: [
        "Impersonating others or providing false information",
        "Harassment, abuse, or discrimination against other users",
        "Posting inappropriate, offensive, or illegal content",
        "Attempting to circumvent our security measures",
        "Using the service for any illegal or unauthorized purpose",
        "Spamming or sending unsolicited communications"
      ]
    },
    {
      title: "Intellectual Property",
      icon: Shield,
      color: "text-teal-400",
      content: [
        "The Thryve platform and all content are protected by intellectual property laws",
        "You may not copy, modify, or distribute our content without permission",
        "User-generated content remains yours, but you grant us a license to use it",
        "You must respect the intellectual property rights of others",
        "We will respond to valid copyright infringement claims",
        "Trademark and logo usage requires our written permission"
      ]
    },
    {
      title: "Liability & Disclaimers",
      icon: AlertTriangle,
      color: "text-red-500",
      content: [
        "You participate in fitness activities at your own risk",
        "We are not liable for injuries that occur during classes",
        "Our service is provided \"as is\" without warranties",
        "We are not responsible for third-party studio actions",
        "Our liability is limited to the amount you paid for our service",
        "Some jurisdictions may not allow liability limitations"
      ]
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
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
            </div>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-4">
              These terms govern your use of the Thryve platform. Please read them carefully before using our services.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-300">
              <span>Effective Date: January 1, 2024</span>
              <span>•</span>
              <span>Last Updated: January 1, 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Summary */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <Gavel className="h-6 w-6 text-blue-400" />
                <span>Terms Summary</span>
              </CardTitle>
              <CardDescription className="text-blue-200">
                Key points you should know about using Thryve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">You must be 18+ to use our service</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">You're responsible for your account security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">Follow cancellation policies to avoid fees</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">Participate in fitness activities at your own risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">Respect others and follow community guidelines</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">Studios are responsible for class quality and safety</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-blue-200 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Important Notices */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-r from-red-600/20 to-red-700/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span>Important Notice</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  <strong>Health & Safety:</strong> Participation in fitness activities involves inherent risks. 
                  Consult your physician before beginning any exercise program.
                </p>
                <p className="text-blue-200 text-sm">
                  <strong>Age Requirement:</strong> You must be at least 18 years old to use our service. 
                  Minors require parental consent and supervision.
                </p>
                <p className="text-blue-200 text-sm">
                  <strong>Platform Changes:</strong> We may modify or discontinue features with reasonable notice. 
                  Continued use implies acceptance of changes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>Questions?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <div className="text-white text-sm">
                    <strong>Email:</strong> <a href="mailto:legal@thryveapp.com" className="text-blue-400 hover:text-blue-300">legal@thryveapp.com</a>
                  </div>
                  <div className="text-white text-sm">
                    <strong>Support:</strong> <a href="mailto:support@thryveapp.com" className="text-blue-400 hover:text-blue-300">support@thryveapp.com</a>
                  </div>
                </div>
                <Link href="/contact-us" className="block">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-white text-sm font-medium">Contact Support</div>
                    <div className="text-blue-300 text-xs">Get help with terms or account issues</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Governing Law */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Globe className="h-5 w-5 text-purple-400" />
                <span>Governing Law & Disputes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">Governing Law</h4>
                  <p className="text-blue-200 text-sm">
                    These terms are governed by the laws of the State of California, United States, 
                    without regard to conflict of law principles.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Dispute Resolution</h4>
                  <p className="text-blue-200 text-sm">
                    Any disputes arising from these terms will be resolved through binding arbitration 
                    in accordance with the American Arbitration Association rules.
                  </p>
                </div>
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