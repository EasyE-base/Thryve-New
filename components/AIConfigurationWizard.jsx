'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  Calendar,
  Settings,
  Target,
  TrendingUp,
  MapPin,
  Building,
  Zap,
  Star,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

const AIConfigurationWizard = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [studioData, setStudioData] = useState({
    studioName: '',
    studioType: '',
    location: '',
    targetAudience: '',
    experience: '',
    specialties: [],
    goals: '',
    budget: '',
    spaceSize: '',
    equipment: []
  })
  const [analysis, setAnalysis] = useState(null)
  const [configuration, setConfiguration] = useState(null)
  const [preferences, setPreferences] = useState({})
  const [isCompleted, setIsCompleted] = useState(false)

  const steps = [
    {
      title: 'Studio Information',
      description: 'Tell us about your studio',
      icon: Building,
      component: 'StudioInfo'
    },
    {
      title: 'AI Analysis',
      description: 'Our AI analyzes your requirements',
      icon: Bot,
      component: 'AIAnalysis'
    },
    {
      title: 'Configuration Review',
      description: 'Review and customize your setup',
      icon: Settings,
      component: 'ConfigReview'
    },
    {
      title: 'Implementation',
      description: 'Apply configuration to your studio',
      icon: Zap,
      component: 'Implementation'
    },
    {
      title: 'Complete',
      description: 'Your studio is ready!',
      icon: CheckCircle,
      component: 'Complete'
    }
  ]

  const studioTypes = [
    'Yoga Studio',
    'Pilates Studio',
    'CrossFit Box',
    'Dance Studio',
    'Martial Arts Dojo',
    'Barre Studio',
    'Cycling Studio',
    'General Fitness',
    'Boutique Fitness',
    'Wellness Center'
  ]

  const targetAudiences = [
    'Beginners',
    'Intermediate',
    'Advanced',
    'Seniors',
    'Youth',
    'Professionals',
    'Stay-at-home parents',
    'Athletes',
    'Mixed levels'
  ]

  const specialtyOptions = [
    'Hatha Yoga',
    'Vinyasa Flow',
    'Power Yoga',
    'Restorative Yoga',
    'Classical Pilates',
    'Reformer Pilates',
    'HIIT Training',
    'Strength Training',
    'Cardio Classes',
    'Meditation',
    'Prenatal Classes',
    'Injury Recovery',
    'Competition Training',
    'Mindfulness',
    'Nutrition Coaching'
  ]

  const equipmentOptions = [
    'Yoga mats',
    'Pilates reformers',
    'Free weights',
    'Resistance bands',
    'Stability balls',
    'Kettlebells',
    'TRX systems',
    'Cardio equipment',
    'Mirrors',
    'Sound system',
    'Blocks and props',
    'Barres',
    'Aerial silks',
    'Balance boards'
  ]

  const handleInputChange = (field, value) => {
    setStudioData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field, option, checked) => {
    setStudioData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], option]
        : prev[field].filter(item => item !== option)
    }))
  }

  const analyzeStudio = async () => {
    if (!user) {
      toast.error('Please log in to continue')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/server-api/ai-wizard/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ studioData })
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        setCurrentStep(2)
        toast.success('Studio analysis completed!')
      } else {
        toast.error(data.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze studio requirements')
    } finally {
      setLoading(false)
    }
  }

  const generateConfiguration = async () => {
    if (!analysis) return

    setLoading(true)
    try {
      const response = await fetch('/server-api/ai-wizard/generate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ 
          analysisResults: analysis,
          preferences 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setConfiguration(data.configuration)
        setCurrentStep(3)
        toast.success('Configuration generated!')
      } else {
        toast.error(data.error || 'Configuration failed')
      }
    } catch (error) {
      console.error('Configuration error:', error)
      toast.error('Failed to generate configuration')
    } finally {
      setLoading(false)
    }
  }

  const applyConfiguration = async () => {
    if (!configuration) return

    setLoading(true)
    try {
      const response = await fetch('/server-api/ai-wizard/apply-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ configuration })
      })

      const data = await response.json()
      
      if (data.success) {
        setIsCompleted(true)
        setCurrentStep(4)
        toast.success('Configuration applied successfully!')
      } else {
        toast.error(data.error || 'Application failed')
      }
    } catch (error) {
      console.error('Application error:', error)
      toast.error('Failed to apply configuration')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const StudioInfoForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Studio Name</label>
          <input
            type="text"
            value={studioData.studioName}
            onChange={(e) => handleInputChange('studioName', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your studio name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Studio Type</label>
          <select
            value={studioData.studioType}
            onChange={(e) => handleInputChange('studioType', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select studio type</option>
            {studioTypes.map(type => (
              <option key={type} value={type} className="text-gray-800">{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Location</label>
          <input
            type="text"
            value={studioData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="City, State or Region"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
          <select
            value={studioData.targetAudience}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select primary audience</option>
            {targetAudiences.map(audience => (
              <option key={audience} value={audience} className="text-gray-800">{audience}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Experience Level</label>
          <select
            value={studioData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select your experience</option>
            <option value="first-time" className="text-gray-800">First-time studio owner</option>
            <option value="some-experience" className="text-gray-800">Some experience</option>
            <option value="experienced" className="text-gray-800">Experienced owner</option>
            <option value="veteran" className="text-gray-800">Veteran (5+ years)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Budget Range</label>
          <select
            value={studioData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select budget range</option>
            <option value="under-10k" className="text-gray-800">Under $10,000</option>
            <option value="10k-25k" className="text-gray-800">$10,000 - $25,000</option>
            <option value="25k-50k" className="text-gray-800">$25,000 - $50,000</option>
            <option value="50k-100k" className="text-gray-800">$50,000 - $100,000</option>
            <option value="over-100k" className="text-gray-800">Over $100,000</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Space Size</label>
        <input
          type="text"
          value={studioData.spaceSize}
          onChange={(e) => handleInputChange('spaceSize', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g., 1200 sq ft, 2 rooms, etc."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Primary Goals</label>
        <textarea
          value={studioData.goals}
          onChange={(e) => handleInputChange('goals', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="What do you want to achieve with your studio?"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-3">Specialties</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {specialtyOptions.map(specialty => (
            <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={studioData.specialties.includes(specialty)}
                onChange={(e) => handleArrayChange('specialties', specialty, e.target.checked)}
                className="rounded border-white/20 text-blue-400 focus:ring-blue-400"
              />
              <span className="text-white text-sm">{specialty}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-3">Available Equipment</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {equipmentOptions.map(equipment => (
            <label key={equipment} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={studioData.equipment.includes(equipment)}
                onChange={(e) => handleArrayChange('equipment', equipment, e.target.checked)}
                className="rounded border-white/20 text-blue-400 focus:ring-blue-400"
              />
              <span className="text-white text-sm">{equipment}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const AIAnalysisComponent = () => (
    <div className="space-y-6">
      {!analysis ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-white mb-4">AI is analyzing your studio...</h3>
          <p className="text-blue-200">Our AI is processing your requirements and generating personalized recommendations</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Analysis Complete!</h3>
              <p className="text-green-200">Confidence: {Math.round(analysis.confidence * 100)}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Studio Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-200">Type:</span>
                  <span className="text-white">{analysis.studioProfile.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Location:</span>
                  <span className="text-white">{analysis.studioProfile.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Target:</span>
                  <span className="text-white">{analysis.studioProfile.targetAudience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Experience:</span>
                  <span className="text-white">{analysis.studioProfile.experience}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Key Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.keyRecommendations?.slice(0, 4).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-white text-sm">{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <Button 
            onClick={generateConfiguration}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3"
          >
            {loading ? 'Generating Configuration...' : 'Generate Studio Configuration'}
          </Button>
        </div>
      )}
    </div>
  )

  const ConfigurationReview = () => (
    <div className="space-y-6">
      {!configuration ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-white mb-4">Generating your configuration...</h3>
          <p className="text-blue-200">Creating a personalized setup for your studio</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Configuration Ready!</h3>
              <p className="text-purple-200">Review and customize your studio setup</p>
            </div>
          </div>
          
          <Tabs defaultValue="classes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="classes" className="text-white">Classes</TabsTrigger>
              <TabsTrigger value="pricing" className="text-white">Pricing</TabsTrigger>
              <TabsTrigger value="policies" className="text-white">Policies</TabsTrigger>
              <TabsTrigger value="staff" className="text-white">Staff</TabsTrigger>
            </TabsList>
            
            <TabsContent value="classes" className="space-y-4">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recommended Classes</CardTitle>
                  <CardDescription className="text-blue-200">
                    AI-generated class schedule optimized for your target audience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configuration.recommendedClasses?.slice(0, 4).map((cls, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-semibold text-white mb-2">{cls.name}</h4>
                        <p className="text-blue-200 text-sm mb-2">{cls.description}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-300">Duration: {cls.duration}</span>
                          <span className="text-green-300">Price: ${cls.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-4">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Pricing Strategy</CardTitle>
                  <CardDescription className="text-blue-200">
                    Optimized pricing based on your market and goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white mb-2">Drop-in Rate</h4>
                      <p className="text-2xl font-bold text-green-400">${configuration.pricingStrategy?.dropInRate || 25}</p>
                      <p className="text-blue-200 text-sm">Per class</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white mb-2">Class Package</h4>
                      <p className="text-2xl font-bold text-green-400">${configuration.pricingStrategy?.classPackage || 180}</p>
                      <p className="text-blue-200 text-sm">10 classes</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white mb-2">Monthly</h4>
                      <p className="text-2xl font-bold text-green-400">${configuration.pricingStrategy?.monthly || 120}</p>
                      <p className="text-blue-200 text-sm">Unlimited</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="policies" className="space-y-4">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Studio Policies</CardTitle>
                  <CardDescription className="text-blue-200">
                    Recommended policies for smooth operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Cancellation Policy</h4>
                    <p className="text-blue-200 text-sm">
                      {configuration.policies?.cancellation || "Cancel up to 2 hours before class for full credit"}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-semibold text-white mb-2">No-Show Policy</h4>
                    <p className="text-blue-200 text-sm">
                      {configuration.policies?.noShow || "No-show fees apply for reserved classes"}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Refund Policy</h4>
                    <p className="text-blue-200 text-sm">
                      {configuration.policies?.refund || "Refunds available within 7 days of purchase"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="staff" className="space-y-4">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Staffing Plan</CardTitle>
                  <CardDescription className="text-blue-200">
                    Recommended staffing structure for your studio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {configuration.staffingPlan?.roles?.map((role, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white mb-1">{role.title}</h4>
                            <p className="text-blue-200 text-sm mb-2">{role.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-blue-300">Hours: {role.hours}</span>
                              <span className="text-green-300">Rate: ${role.rate}/hr</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-white border-white/20">
                            {role.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3"
          >
            Proceed to Implementation
          </Button>
        </div>
      )}
    </div>
  )

  const ImplementationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Ready to Apply Configuration</h3>
        <p className="text-blue-200">This will set up your studio with the generated configuration</p>
      </div>
      
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Implementation Plan</CardTitle>
          <CardDescription className="text-blue-200">
            What will be configured in your studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white">Studio profile and settings</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white">Class schedule and pricing</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white">Business policies and rules</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white">Staff roles and permissions</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white">Implementation timeline</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Alert className="bg-yellow-500/20 border-yellow-400/50">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          This will overwrite your current studio configuration. Make sure you're ready to proceed.
        </AlertDescription>
      </Alert>
      
      <Button 
        onClick={applyConfiguration}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3"
      >
        {loading ? 'Applying Configuration...' : 'Apply Configuration'}
      </Button>
    </div>
  )

  const CompletionStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">Configuration Complete!</h3>
        <p className="text-green-200 text-lg">Your studio is now ready to welcome students</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Next Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-medium">Review Your Dashboard</h4>
                <p className="text-blue-200 text-sm">Check your merchant dashboard for all configured settings</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-medium">Invite Your Team</h4>
                <p className="text-blue-200 text-sm">Add instructors and staff members to your studio</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-medium">Start Taking Bookings</h4>
                <p className="text-blue-200 text-sm">Your classes are live and ready for student bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Success Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-blue-200">Classes Configured:</span>
              <span className="text-white font-medium">{configuration?.recommendedClasses?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Pricing Tiers:</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Policies Set:</span>
              <span className="text-white font-medium">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">Staff Roles:</span>
              <span className="text-white font-medium">{configuration?.staffingPlan?.roles?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          onClick={() => window.location.href = '/dashboard/merchant'}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        >
          Go to Dashboard
        </Button>
        <Button 
          onClick={() => window.location.href = '/studio/create-class'}
          variant="outline"
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Create First Class
        </Button>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StudioInfoForm />
      case 1:
        return <AIAnalysisComponent />
      case 2:
        return <ConfigurationReview />
      case 3:
        return <ImplementationStep />
      case 4:
        return <CompletionStep />
      default:
        return <StudioInfoForm />
    }
  }

  const canProceed = () => {
    if (currentStep === 0) {
      return studioData.studioName && studioData.studioType && studioData.location && 
             studioData.targetAudience && studioData.experience && studioData.goals
    }
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Configuration Wizard</h1>
          </div>
          <p className="text-blue-200 text-lg">Let our AI help you set up your studio in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep || isCompleted
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-blue-400 bg-blue-500/20' 
                      : isCompleted 
                      ? 'border-green-400 bg-green-500/20' 
                      : 'border-white/20 bg-white/10'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-white/60'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-blue-200' : isCompleted ? 'text-green-200' : 'text-white/60'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-white/40 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress 
            value={(currentStep / (steps.length - 1)) * 100} 
            className="h-2 bg-white/20"
          />
          <div className="flex justify-between text-sm text-white/60 mt-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round((currentStep / (steps.length - 1)) * 100)}% Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-blue-200">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between items-center">
            <Button 
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-4">
              {currentStep === 0 && (
                <Button 
                  onClick={analyzeStudio}
                  disabled={!canProceed() || loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Studio
                    </>
                  )}
                </Button>
              )}
              
              {currentStep === 1 && analysis && (
                <Button 
                  onClick={generateConfiguration}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  {loading ? 'Generating...' : 'Generate Configuration'}
                </Button>
              )}
              
              {currentStep > 1 && currentStep < 3 && (
                <Button 
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIConfigurationWizard