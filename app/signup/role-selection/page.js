'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    console.log('🎉 Enhanced Role Selection Page Loaded!');
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return;

    setIsLoading(true);
    try {
      // Get the current user's ID token
      const idToken = await user.getIdToken();
      
      // Call the API route to update the role
      const response = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ role: selectedRole })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Role set successfully!`);

        // Redirect based on role
        switch (selectedRole) {
          case 'studio':
            router.push('/onboarding/merchant');
            break;
          case 'instructor':
            router.push('/onboarding/instructor');
            break;
          case 'customer':
            router.push('/onboarding/customer');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        toast.error(result.error || 'Failed to save role. Please try again.');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to save role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'studio',
      title: 'Studio Owner',
      description: 'Manage your fitness studio, schedule classes, and grow your business',
      icon: '🏢',
      features: [
        'Create and manage class schedules',
        'Track revenue and attendance',
        'Manage instructors',
        'Accept online bookings'
      ],
      color: 'bg-purple-500'
    },
    {
      id: 'instructor',
      title: 'Fitness Instructor',
      description: 'Teach classes, build your following, and manage your schedule',
      icon: '🏋️‍♀️',
      features: [
        'Create your instructor profile',
        'Manage class schedules',
        'Track your students',
        'Get paid seamlessly'
      ],
      color: 'bg-blue-500'
    },
    {
      id: 'customer',
      title: 'Fitness Enthusiast',
      description: 'Discover and book fitness classes that match your goals',
      icon: '💪',
      features: [
        'Browse nearby studios',
        'Book classes instantly',
        'Track your fitness journey',
        'Save favorite instructors'
      ],
      color: 'bg-green-500'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to THRYVE! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's get you started. First, tell us how you'll be using THRYVE.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left ${
                selectedRole === role.id ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Selected indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon with gradient background */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${role.color} mb-6`}>
                <span className="text-4xl">{role.icon}</span>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.title}</h3>
              <p className="text-gray-600 mb-6">{role.description}</p>

              {/* Features */}
              <ul className="space-y-3">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className={`px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
              selectedRole && !isLoading
                ? 'bg-black text-white hover:bg-gray-800 transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting up your account...
              </span>
            ) : (
              `Continue as ${selectedRole ? roles.find(r => r.id === selectedRole)?.title : '...'}`
            )}
          </button>
          
          {!selectedRole && (
            <p className="mt-4 text-sm text-gray-500">
              Please select a role to continue
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Not sure which role to choose?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Learn more about each role
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}