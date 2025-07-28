'use client'

import Link from 'next/link'
import { 
  Cookie, 
  Settings, 
  Eye, 
  BarChart3, 
  Heart, 
  Shield, 
  Clock,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function CookiePolicy() {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always enabled
    functional: true,
    analytics: true,
    marketing: false
  })

  const cookieTypes = [
    {
      title: "Essential Cookies",
      icon: Shield,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      required: true,
      description: "Necessary for the website to function properly and cannot be disabled.",
      examples: [
        "User authentication and session management",
        "Security tokens and CSRF protection",
        "Load balancing and server routing",
        "Form submission and data processing",
        "Basic website functionality"
      ],
      duration: "Session or until logout"
    },
    {
      title: "Functional Cookies",
      icon: Settings,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      required: false,
      description: "Enable enhanced functionality and personalization features.",
      examples: [
        "Language and region preferences",
        "UI theme and display settings",
        "Saved form data and preferences",
        "Accessibility settings",
        "Recently viewed classes"
      ],
      duration: "Up to 1 year"
    },
    {
      title: "Analytics Cookies",
      icon: BarChart3,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      required: false,
      description: "Help us understand how visitors interact with our website.",
      examples: [
        "Page views and user navigation paths",
        "Feature usage and engagement metrics",
        "Performance monitoring and error tracking",
        "A/B testing and optimization",
        "Anonymous usage statistics"
      ],
      duration: "Up to 2 years"
    },
    {
      title: "Marketing Cookies",
      icon: Heart,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      required: false,
      description: "Used to provide relevant advertisements and track campaign effectiveness.",
      examples: [
        "Personalized content recommendations",
        "Social media integration",
        "Email marketing tracking",
        "Advertising campaign measurement",
        "Cross-platform user identification"
      ],
      duration: "Up to 1 year"
    }
  ]

  const handleToggle = (type) => {
    if (type === 'essential') return // Essential cookies cannot be disabled
    
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const savePreferences = () => {
    // Save preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences))
    
    // Here you would typically send the preferences to your backend
    console.log('Cookie preferences saved:', cookiePreferences)
    
    // Show success message
    alert('Cookie preferences saved successfully!')
  }

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    setCookiePreferences(allAccepted)
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted))
    alert('All cookies accepted!')
  }

  const rejectAll = () => {
    const onlyEssential = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    setCookiePreferences(onlyEssential)
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyEssential))
    alert('Only essential cookies are enabled!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Cookie className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Cookie Policy</h1>
            </div>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-4">
              We use cookies to enhance your experience, provide personalized content, and analyze our website traffic.
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
        {/* What are Cookies */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <Cookie className="h-6 w-6 text-blue-400" />
                <span>What are Cookies?</span>
              </CardTitle>
              <CardDescription className="text-blue-200">
                Understanding how cookies work and why we use them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-blue-200">
                  Cookies are small text files that are placed on your device when you visit our website. 
                  They help us provide you with a better, faster, and more secure experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Improve website functionality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Remember your preferences</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Analyze website performance</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Secure your account</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Provide personalized content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white text-sm">Understand user behavior</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cookie Preference Center */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <Settings className="h-6 w-6 text-purple-400" />
                <span>Cookie Preference Center</span>
              </CardTitle>
              <CardDescription className="text-blue-200">
                Manage your cookie preferences and control your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cookieTypes.map((type, index) => {
                  const Icon = type.icon
                  const isEnabled = cookiePreferences[type.title.toLowerCase().split(' ')[0]]
                  const ToggleIcon = isEnabled ? ToggleRight : ToggleLeft
                  
                  return (
                    <div key={index} className="border border-white/10 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${type.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`h-6 w-6 ${type.color}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                              <span>{type.title}</span>
                              {type.required && (
                                <Badge className="bg-red-500/20 text-red-300 border-red-400/50">
                                  Required
                                </Badge>
                              )}
                            </h3>
                            <p className="text-blue-200 text-sm mt-1">{type.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggle(type.title.toLowerCase().split(' ')[0])}
                          disabled={type.required}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            type.required 
                              ? 'cursor-not-allowed opacity-50' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <ToggleIcon className={`h-6 w-6 ${
                            isEnabled ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          <span className="text-white text-sm">
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-white font-medium mb-2">Examples:</h4>
                          <ul className="space-y-1">
                            {type.examples.map((example, exampleIndex) => (
                              <li key={exampleIndex} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-blue-200 text-sm">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-2">Duration:</h4>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-200 text-sm">{type.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Button 
                  onClick={savePreferences}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
                <Button 
                  onClick={acceptAll}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
                <Button 
                  onClick={rejectAll}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reject All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Managing Cookies */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <span>Browser Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  You can also manage cookies through your browser settings:
                </p>
                <div className="space-y-2">
                  <div className="text-white text-sm">
                    <strong>Chrome:</strong> Settings → Privacy and Security → Cookies
                  </div>
                  <div className="text-white text-sm">
                    <strong>Firefox:</strong> Settings → Privacy & Security → Cookies
                  </div>
                  <div className="text-white text-sm">
                    <strong>Safari:</strong> Preferences → Privacy → Cookies
                  </div>
                  <div className="text-white text-sm">
                    <strong>Edge:</strong> Settings → Privacy → Cookies
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-green-400" />
                  <span>Regular Updates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-blue-200 text-sm">
                  We may update this Cookie Policy to reflect changes in our practices or for legal reasons.
                </p>
                <div className="space-y-2">
                  <div className="text-white text-sm">
                    <strong>Notifications:</strong> We'll notify you of significant changes
                  </div>
                  <div className="text-white text-sm">
                    <strong>Review:</strong> Please review this policy periodically
                  </div>
                  <div className="text-white text-sm">
                    <strong>Contact:</strong> Questions? Email us at privacy@thryveapp.com
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Important Notice</h3>
                  <p className="text-blue-200 text-sm">
                    Disabling certain cookies may impact your experience on our website. Essential cookies are always enabled to ensure basic functionality. 
                    For questions about our cookie usage, please contact our privacy team at privacy@thryveapp.com.
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