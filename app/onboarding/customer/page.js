'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, User, Target, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    fitnessLevel: '',
    goals: [],
    medicalConditions: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  const router = useRouter()
  const totalSteps = 3

  // Simple session check - just verify we have a role parameter
  useEffect(() => {
    // For simple auth, we'll assume if they reached this page, they have customer role
    console.log('Customer onboarding loaded - simple auth mode')
  }, [])

  const completeOnboarding = async () => {
    if (loading) return

    setLoading(true)

    try {
      console.log('=== SIMPLE ONBOARDING COMPLETION ===')
      
      // For now, just mark onboarding as complete and redirect
      // In a full implementation, you'd save the profile data to the database
      toast.success('Welcome to Thryve! Your profile is complete.')
      
      // Redirect to customer dashboard
      router.push('/dashboard/customer')
    } catch (error) {
      console.error('Onboarding completion error:', error)
      toast.error('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedFormData = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const isStepValid = (step) => {
    switch(step) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone && formData.dateOfBirth
      case 2:
        return formData.fitnessLevel && formData.goals.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Customer Onboarding
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Let's get your profile set up so you can start your fitness journey
          </p>
          <div className="mt-4">
            <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
            <p className="text-sm text-gray-500 mt-2">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {currentStep === 1 && <User className="h-5 w-5 mr-2" />}
              {currentStep === 2 && <Target className="h-5 w-5 mr-2" />}
              {currentStep === 3 && <CheckCircle className="h-5 w-5 mr-2" />}
              
              {currentStep === 1 && "Personal Information"}
              {currentStep === 2 && "Fitness Goals & Preferences"}
              {currentStep === 3 && "Emergency Contact & Health"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself"}
              {currentStep === 2 && "Help us personalize your experience"}
              {currentStep === 3 && "Safety and health information"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={(value) => updateFormData('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Fitness Goals & Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fitnessLevel">Current Fitness Level *</Label>
                  <Select onValueChange={(value) => updateFormData('fitnessLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your fitness level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - New to fitness</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                      <SelectItem value="advanced">Advanced - Very experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Fitness Goals * (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      'Weight Loss',
                      'Muscle Building',
                      'Cardiovascular Health',
                      'Flexibility',
                      'Strength Training',
                      'Sport-Specific Training',
                      'Stress Relief',
                      'General Wellness'
                    ].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={formData.goals.includes(goal)}
                          onCheckedChange={() => toggleGoal(goal)}
                        />
                        <Label htmlFor={goal} className="text-sm font-normal">
                          {goal}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact & Health */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="medicalConditions">
                    Medical Conditions or Injuries (Optional)
                  </Label>
                  <Textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => updateFormData('medicalConditions', e.target.value)}
                    placeholder="Please list any medical conditions, injuries, or physical limitations we should be aware of..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Emergency Contact</Label>
                  <div className="grid gap-4 mt-3">
                    <div>
                      <Label htmlFor="emergencyName">Contact Name</Label>
                      <Input
                        id="emergencyName"
                        value={formData.emergencyContact.name}
                        onChange={(e) => updateNestedFormData('emergencyContact', 'name', e.target.value)}
                        placeholder="Emergency contact full name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyPhone">Phone Number</Label>
                        <Input
                          id="emergencyPhone"
                          type="tel"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => updateNestedFormData('emergencyContact', 'phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyRelationship">Relationship</Label>
                        <Input
                          id="emergencyRelationship"
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => updateNestedFormData('emergencyContact', 'relationship', e.target.value)}
                          placeholder="e.g., Spouse, Parent, Friend"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Complete Setup
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}