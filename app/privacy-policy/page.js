'use client'

import Link from 'next/link'
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Cookie, 
  Mail, 
  Users, 
  FileText,
  CheckCircle,
  AlertCircle,
  Globe,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      color: "text-blue-400",
      content: [
        "Personal information (name, email, phone number) when you create an account",
        "Profile information for studio owners, instructors, and members",
        "Class booking and attendance data",
        "Payment information (processed securely through Stripe)",
        "Device information and usage analytics to improve our service",
        "Communications between users and support team"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: Settings,
      color: "text-green-400",
      content: [
        "Provide and improve our fitness platform services",
        "Process class bookings and payments",
        "Send important notifications about your bookings and account",
        "Analyze platform usage to enhance user experience",
        "Provide customer support and respond to your inquiries",
        "Comply with legal obligations and prevent fraud"
      ]
    },
    {
      title: "Information Sharing",
      icon: Users,
      color: "text-purple-400",
      content: [
        "We do not sell your personal information to third parties",
        "Studio owners can see basic information of their class attendees",
        "Instructors can access student names for class management",
        "Payment processors (Stripe) receive necessary transaction data",
        "Legal authorities may receive information if required by law",
        "Service providers who help us operate the platform (with strict confidentiality)"
      ]
    },
    {
      title: "Data Security",
      icon: Lock,
      color: "text-red-400",
      content: [
        "All data is encrypted in transit and at rest",
        "Regular security audits and penetration testing",
        "Access controls and authentication for all systems",
        "Secure payment processing through PCI-compliant providers",
        "Regular backups and disaster recovery procedures",
        "Employee training on data protection best practices"
      ]
    },
    {
      title: "Your Rights",
      icon: Shield,
      color: "text-yellow-400",
      content: [
        "Access your personal data and download a copy",
        "Correct any inaccurate or outdated information",
        "Delete your account and personal data",
        "Opt-out of marketing communications",
        "Request data portability to another service",
        "Lodge a complaint with data protection authorities"
      ]
    },
    {
      title: "Cookies & Tracking",
      icon: Cookie,
      color: "text-orange-400",
      content: [
        "Essential cookies for platform functionality",
        "Analytics cookies to understand user behavior",
        "Preference cookies to remember your settings",
        "No advertising or tracking cookies from third parties",
        "You can manage cookie preferences in your browser",
        "Session cookies that expire when you close the app"
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
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
            </div>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-4">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
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
          <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Privacy at a Glance</span>
              </CardTitle>
              <CardDescription className="text-blue-200">
                Here's what you need to know about how we handle your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">We never sell your personal data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">All data is encrypted and secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">You control your data and can delete it anytime</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">Minimal data collection - only what's necessary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">Transparent about how we use your information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm">GDPR and CCPA compliant</span>
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

        {/* Contact & Rights */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>Contact Us</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  If you have any questions about this privacy policy or how we handle your data, please contact us:
                </p>
                <div className="space-y-2">
                  <div className="text-white text-sm">
                    <strong>Email:</strong> <a href="mailto:privacy@thryveapp.com" className="text-blue-400 hover:text-blue-300">privacy@thryveapp.com</a>
                  </div>
                  <div className="text-white text-sm">
                    <strong>Data Protection Officer:</strong> <a href="mailto:dpo@thryveapp.com" className="text-blue-400 hover:text-blue-300">dpo@thryveapp.com</a>
                  </div>
                  <div className="text-white text-sm">
                    <strong>Address:</strong> 123 Fitness Ave, Tech City, TC 12345
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-400" />
                  <span>Exercise Your Rights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  You can manage your data and privacy settings directly in your account or contact us for assistance.
                </p>
                <div className="space-y-2">
                  <Link href="/settings" className="block">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="text-white text-sm font-medium">Account Settings</div>
                      <div className="text-blue-300 text-xs">Update your privacy preferences</div>
                    </div>
                  </Link>
                  <Link href="/contact-us" className="block">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="text-white text-sm font-medium">Data Requests</div>
                      <div className="text-blue-300 text-xs">Request data access, correction, or deletion</div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Updates Notice */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Policy Updates</h3>
                  <p className="text-blue-200 text-sm">
                    We may update this privacy policy from time to time. When we do, we'll notify you by email and update the "Last Updated" date. 
                    Continued use of our service after changes means you accept the updated policy.
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