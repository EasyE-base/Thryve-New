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
  Building2, MapPin, Phone, Mail, Globe, Clock, 
  CreditCard, CheckCircle, ArrowRight, Plus, X 
} from 'lucide-react';

const StudioProfileBuilder = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [studioData, setStudioData] = useState({
    // Basic Info
    studioName: '',
    studioType: '',
    description: '',
    
    // Contact Info
    phoneNumber: '',
    businessEmail: '',
    website: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Operating Hours
    operatingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '08:00', close: '20:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    
    // Amenities
    amenities: [],
    
    // Classes Offered
    classTypes: [],
    
    // Payment Methods
    paymentMethods: [],
    
    // Pricing
    dropInPrice: '',
    monthlyMembership: '',
    yearlyMembership: ''
  });

  const studioTypes = [
    'Yoga Studio', 'CrossFit Box', 'Traditional Gym', 'Pilates Studio',
    'Martial Arts Dojo', 'Dance Studio', 'Boxing Gym', 'Climbing Gym',
    'Boutique Fitness', 'Personal Training Studio', 'Other'
  ];

  const commonAmenities = [
    'Showers', 'Lockers', 'Parking', 'Wi-Fi', 'Water Fountain',
    'Towel Service', 'Sauna', 'Steam Room', 'Juice Bar', 'Pro Shop',
    'Childcare', 'Air Conditioning', 'Changing Rooms', 'Equipment Rental'
  ];

  const classTypeOptions = [
    'Yoga', 'Pilates', 'HIIT', 'Spin/Cycling', 'Zumba', 'CrossFit',
    'Boxing', 'Kickboxing', 'Strength Training', 'Cardio', 'Dance',
    'Barre', 'TRX', 'Bootcamp', 'Personal Training', 'Group Fitness'
  ];

  const paymentOptions = [
    'Credit Card', 'Debit Card', 'Cash', 'Check', 'PayPal',
    'Venmo', 'Zelle', 'Apple Pay', 'Google Pay', 'Monthly Billing'
  ];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'merchant')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field, value) => {
    setStudioData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setStudioData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const toggleArrayItem = (array, item) => {
    setStudioData(prev => ({
      ...prev,
      [array]: prev[array].includes(item)
        ? prev[array].filter(i => i !== item)
        : [...prev[array], item]
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return studioData.studioName && studioData.studioType && studioData.description;
      case 2:
        return studioData.phoneNumber && studioData.businessEmail && 
               studioData.address && studioData.city && studioData.state && studioData.zipCode;
      case 3:
        return studioData.amenities.length > 0 && studioData.classTypes.length > 0;
      case 4:
        return studioData.paymentMethods.length > 0 && studioData.dropInPrice && 
               studioData.monthlyMembership;
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
      // Create studio profile document
      await setDoc(doc(db, 'studios', user.uid), {
        ...studioData,
        ownerId: user.uid,
        ownerEmail: user.email,
        status: 'active',
        verified: false,
        rating: 0,
        reviewCount: 0,
        memberCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user profile to mark as complete
      await setDoc(doc(db, 'users', user.uid), {
        profileComplete: true,
        studioId: user.uid
      }, { merge: true });

      console.log('Studio profile created successfully');
      router.push('/dashboard/merchant');
    } catch (error) {
      console.error('Error creating studio profile:', error);
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
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm mb-4">
            Studio Profile Setup
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Set Up Your Studio
          </h1>
          <p className="text-xl text-gray-600">
            Tell us about your fitness studio to get started
          </p>
        </div>

        {/* Progress Steps */}
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
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Location & Contact'}
              {currentStep === 3 && 'Amenities & Classes'}
              {currentStep === 4 && 'Pricing & Payment'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about your fitness studio'}
              {currentStep === 2 && 'Where can members find you?'}
              {currentStep === 3 && 'What do you offer?'}
              {currentStep === 4 && 'How do members pay?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Studio Name *</label>
                  <Input
                    placeholder="Enter your studio name"
                    value={studioData.studioName}
                    onChange={(e) => handleInputChange('studioName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Studio Type *</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={studioData.studioType}
                    onChange={(e) => handleInputChange('studioType', e.target.value)}
                  >
                    <option value="">Select studio type</option>
                    {studioTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={4}
                    placeholder="Describe your studio and what makes it unique..."
                    value={studioData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={studioData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="studio@example.com"
                        className="pl-10"
                        value={studioData.businessEmail}
                        onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="https://www.yourstudio.com"
                      className="pl-10"
                      value={studioData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="123 Main Street"
                      className="pl-10"
                      value={studioData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City *</label>
                    <Input
                      placeholder="City"
                      value={studioData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State *</label>
                    <Input
                      placeholder="State"
                      value={studioData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP Code *</label>
                    <Input
                      placeholder="12345"
                      value={studioData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Operating Hours
                  </label>
                  <div className="space-y-2">
                    {Object.entries(studioData.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <span className="w-24 text-sm capitalize">{day}</span>
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                        />
                        {!hours.closed && (
                          <>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                              className="px-2 py-1 border rounded"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                              className="px-2 py-1 border rounded"
                            />
                          </>
                        )}
                        {hours.closed && <span className="text-gray-500">Closed</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Amenities & Classes */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amenities *</label>
                  <p className="text-sm text-gray-600">Select all amenities your studio offers</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {commonAmenities.map(amenity => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioData.amenities.includes(amenity)}
                          onChange={() => toggleArrayItem('amenities', amenity)}
                          className="rounded"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Types Offered *</label>
                  <p className="text-sm text-gray-600">Select all class types available at your studio</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {classTypeOptions.map(classType => (
                      <label key={classType} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioData.classTypes.includes(classType)}
                          onChange={() => toggleArrayItem('classTypes', classType)}
                          className="rounded"
                        />
                        <span className="text-sm">{classType}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Pricing & Payment */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Accepted Payment Methods *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentOptions.map(method => (
                      <label key={method} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioData.paymentMethods.includes(method)}
                          onChange={() => toggleArrayItem('paymentMethods', method)}
                          className="rounded"
                        />
                        <span className="text-sm">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Drop-in Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">$</span>
                      <Input
                        type="number"
                        placeholder="25"
                        className="pl-8"
                        value={studioData.dropInPrice}
                        onChange={(e) => handleInputChange('dropInPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Membership *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">$</span>
                      <Input
                        type="number"
                        placeholder="150"
                        className="pl-8"
                        value={studioData.monthlyMembership}
                        onChange={(e) => handleInputChange('monthlyMembership', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Yearly Membership</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">$</span>
                      <Input
                        type="number"
                        placeholder="1500"
                        className="pl-8"
                        value={studioData.yearlyMembership}
                        onChange={(e) => handleInputChange('yearlyMembership', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
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

export default StudioProfileBuilder;