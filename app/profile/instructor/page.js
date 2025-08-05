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
  User, Award, Calendar, DollarSign, Clock, 
  CheckCircle, ArrowRight, Plus, X, Upload 
} from 'lucide-react';

const InstructorProfileBuilder = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [instructorData, setInstructorData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    yearsOfExperience: '',
    specializations: [],
    certifications: [],
    classTypes: [],
    maxClassSize: '',
    privateSessionRate: '',
    groupClassRate: ''
  });

  const [newCertification, setNewCertification] = useState('');

  const specializationOptions = [
    'Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Cardio',
    'CrossFit', 'Boxing', 'Martial Arts', 'Dance', 'Cycling'
  ];

  const classTypeOptions = [
    'Private Training', 'Small Group (2-5)', 'Large Group (6+)',
    'Online Classes', 'Outdoor Training', 'Workshops'
  ];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'instructor')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field, value) => {
    setInstructorData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (array, item) => {
    setInstructorData(prev => ({
      ...prev,
      [array]: prev[array].includes(item)
        ? prev[array].filter(i => i !== item)
        : [...prev[array], item]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setInstructorData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setInstructorData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return instructorData.firstName && instructorData.lastName && 
               instructorData.bio && instructorData.yearsOfExperience;
      case 2:
        return instructorData.specializations.length > 0 && 
               instructorData.certifications.length > 0;
      case 3:
        return instructorData.classTypes.length > 0 && instructorData.maxClassSize;
      case 4:
        return instructorData.privateSessionRate || instructorData.groupClassRate;
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
      await setDoc(doc(db, 'instructors', user.uid), {
        ...instructorData,
        userId: user.uid,
        email: user.email,
        status: 'active',
        verified: false,
        rating: 0,
        reviewCount: 0,
        totalClasses: 0,
        totalStudents: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', user.uid), {
        profileComplete: true,
        instructorId: user.uid
      }, { merge: true });

      console.log('Instructor profile created successfully');
      router.push('/dashboard/instructor');
    } catch (error) {
      console.error('Error creating instructor profile:', error);
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
            Instructor Profile Setup
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Instructor Profile
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about your expertise and teaching style
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
              {currentStep === 2 && 'Qualifications & Expertise'}
              {currentStep === 3 && 'Teaching Preferences'}
              {currentStep === 4 && 'Pricing & Packages'}
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
                      value={instructorData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      placeholder="Doe"
                      value={instructorData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio *</label>
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={4}
                    placeholder="Tell potential clients about yourself..."
                    value={instructorData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Years of Experience *</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={instructorData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </>
            )}

            {/* Step 2: Qualifications */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Specializations *</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {specializationOptions.map(spec => (
                      <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instructorData.specializations.includes(spec)}
                          onChange={() => toggleArrayItem('specializations', spec)}
                          className="rounded"
                        />
                        <span className="text-sm">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Certifications *</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., ACE Certified Personal Trainer"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button
                      type="button"
                      onClick={addCertification}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-3">
                    {instructorData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{cert}</span>
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Teaching Preferences */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Types *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {classTypeOptions.map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={instructorData.classTypes.includes(type)}
                          onChange={() => toggleArrayItem('classTypes', type)}
                          className="rounded"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Maximum Class Size *</label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={instructorData.maxClassSize}
                    onChange={(e) => handleInputChange('maxClassSize', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Private Session Rate</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="80"
                        className="pl-10"
                        value={instructorData.privateSessionRate}
                        onChange={(e) => handleInputChange('privateSessionRate', e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-gray-400 text-sm">/hour</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Class Rate</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="30"
                        className="pl-10"
                        value={instructorData.groupClassRate}
                        onChange={(e) => handleInputChange('groupClassRate', e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-gray-400 text-sm">/person</span>
                    </div>
                  </div>
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

export default InstructorProfileBuilder;