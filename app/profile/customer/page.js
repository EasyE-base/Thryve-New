"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User, Target, Heart, Calendar, MapPin, 
  CheckCircle, ArrowRight, Activity 
} from 'lucide-react';

const CustomerProfileBuilder = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    preferredRadius: '10',
    fitnessGoals: [],
    currentFitnessLevel: '',
    medicalConditions: '',
    preferredActivities: [],
    preferredClassTimes: [],
    preferredClassSize: '',
    budgetRange: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  const fitnessGoalOptions = [
    'Weight Loss', 'Muscle Building', 'Improved Endurance', 'Flexibility',
    'Stress Relief', 'General Health', 'Athletic Performance', 'Rehabilitation'
  ];

  const activityOptions = [
    'Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Cardio',
    'CrossFit', 'Boxing', 'Martial Arts', 'Dance', 'Cycling'
  ];

  const timeSlotOptions = [
    'Early Morning (5-8 AM)', 'Morning (8-11 AM)', 'Lunch (11 AM-2 PM)',
    'Afternoon (2-5 PM)', 'Evening (5-8 PM)', 'Night (8-10 PM)'
  ];

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner - New to fitness' },
    { value: 'intermediate', label: 'Intermediate - Active 1-2 times/week' },
    { value: 'advanced', label: 'Advanced - Active 3-4 times/week' },
    { value: 'expert', label: 'Expert - Active 5+ times/week' }
  ];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (array, item) => {
    setCustomerData(prev => ({
      ...prev,
      [array]: prev[array].includes(item)
        ? prev[array].filter(i => i !== item)
        : [...prev[array], item]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return customerData.firstName && customerData.lastName && 
               customerData.dateOfBirth && customerData.gender;
      case 2:
        return customerData.city && customerData.state && customerData.zipCode;
      case 3:
        return customerData.fitnessGoals.length > 0 && 
               customerData.currentFitnessLevel;
      case 4:
        return customerData.preferredActivities.length > 0 && 
               customerData.preferredClassTimes.length > 0 &&
               customerData.budgetRange;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setDoc(doc(db, 'customers', user.uid), {
        ...customerData,
        userId: user.uid,
        email: user.email,
        status: 'active',
        membershipStatus: 'free',
        totalClasses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', user.uid), {
        profileComplete: true,
        customerId: user.uid
      }, { merge: true });

      console.log('Customer profile created successfully');
      router.push('/dashboard/customer');
    } catch (error) {
      console.error('Error creating customer profile:', error);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm mb-4">
            Member Profile Setup
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Let's Get You Started
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about yourself and your fitness goals
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="h-6 w-6" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Location & Contact'}
              {currentStep === 3 && 'Fitness Goals & Experience'}
              {currentStep === 4 && 'Preferences & Budget'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      placeholder="John"
                      value={customerData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      placeholder="Doe"
                      value={customerData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Birth *</label>
                    <Input
                      type="date"
                      value={customerData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender *</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={customerData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    placeholder="123 Main Street"
                    value={customerData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City *</label>
                    <Input
                      placeholder="City"
                      value={customerData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State *</label>
                    <Input
                      placeholder="State"
                      value={customerData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP Code *</label>
                    <Input
                      placeholder="12345"
                      value={customerData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Fitness Goals */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fitness Goals *</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {fitnessGoalOptions.map(goal => (
                      <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerData.fitnessGoals.includes(goal)}
                          onChange={() => toggleArrayItem('fitnessGoals', goal)}
                          className="rounded"
                        />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Fitness Level *</label>
                  <div className="space-y-3">
                    {fitnessLevels.map(level => (
                      <label key={level.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="fitnessLevel"
                          value={level.value}
                          checked={customerData.currentFitnessLevel === level.value}
                          onChange={(e) => handleInputChange('currentFitnessLevel', e.target.value)}
                        />
                        <span className="text-sm">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Preferences */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Activities *</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {activityOptions.map(activity => (
                      <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerData.preferredActivities.includes(activity)}
                          onChange={() => toggleArrayItem('preferredActivities', activity)}
                          className="rounded"
                        />
                        <span className="text-sm">{activity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Class Times *</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {timeSlotOptions.map(time => (
                      <label key={time} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerData.preferredClassTimes.includes(time)}
                          onChange={() => toggleArrayItem('preferredClassTimes', time)}
                          className="rounded"
                        />
                        <span className="text-sm">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Budget for Fitness *</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={customerData.budgetRange}
                    onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                  >
                    <option value="">Select budget range</option>
                    <option value="0-50">$0 - $50</option>
                    <option value="50-100">$50 - $100</option>
                    <option value="100-200">$100 - $200</option>
                    <option value="200-300">$200 - $300</option>
                    <option value="300+">$300+</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
                className={`${currentStep === 1 ? 'ml-auto' : ''} bg-blue-600 hover:bg-blue-700`}
              >
                {loading ? 'Creating Profile...' : (
                  currentStep === 4 ? 'Complete Setup' : 'Continue'
                )}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfileBuilder;