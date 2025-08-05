"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { updateUserRole } from '@/lib/firebase-auth';
import { User, Dumbbell, Building2, ArrowRight, CheckCircle } from 'lucide-react';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const roles = [
    {
      id: 'customer',
      title: 'Fitness Enthusiast',
      description: 'Book classes, track workouts, and achieve your fitness goals',
      icon: <User className="h-8 w-8" />,
      features: [
        'Book fitness classes',
        'Track your progress',
        'Connect with trainers',
        'Join community challenges'
      ],
      redirectPath: '/profile/customer'
    },
    {
      id: 'instructor',
      title: 'Fitness Instructor',
      description: 'Teach classes, manage clients, and grow your fitness business',
      icon: <Dumbbell className="h-8 w-8" />,
      features: [
        'Create and manage classes',
        'Track client progress',
        'Manage your schedule',
        'Earn from teaching'
      ],
      redirectPath: '/profile/instructor'
    },
    {
      id: 'merchant',
      title: 'Studio Owner',
      description: 'Manage your fitness studio, instructors, and business operations',
      icon: <Building2 className="h-8 w-8" />,
      features: [
        'Manage your studio',
        'Handle instructor payouts',
        'Track business metrics',
        'Grow your community'
      ],
      redirectPath: '/profile/studio'
    }
  ];

  useEffect(() => {
    // If user already has a role, redirect them appropriately
    if (user && user.role) {
      console.log('🔄 Role Selection: User already has role, checking profile:', user.role);
      const userRole = roles.find(r => r.id === user.role);
      if (userRole) {
        // If profile is complete, go to dashboard, otherwise go to profile builder
        if (user.profileComplete) {
          const dashboardPath = userRole.redirectPath.replace('/profile/', '/dashboard/');
          router.push(dashboardPath);
        } else {
          router.push(userRole.redirectPath);
        }
      }
    }
  }, [user, router]);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    if (!user) {
      setError('Authentication session expired. Please sign in again.');
      console.error('❌ Role Selection: No user found - auth not persisted');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Role Selection: Updating user role:', { userId: user.uid, role: selectedRole });
      await updateUserRole(user.uid, selectedRole);
      console.log('✅ Role Selection: User role updated successfully:', selectedRole);

      // Find the selected role and redirect
      const role = roles.find(r => r.id === selectedRole);
      if (role) {
        router.push(role.redirectPath);
      }
    } catch (error) {
      console.error('❌ Role Selection: Error updating user role:', error);
      setError('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in first</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to select your role.</p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="px-4 py-2 text-sm mb-4">
            Complete Your Profile
          </Badge>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you'd like to use THRYVE to get a personalized experience tailored to your needs.
          </p>

          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Welcome, {user.email}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-xl ${
                selectedRole === role.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                  : 'border-gray-200 hover:border-blue-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !loading && setSelectedRole(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  selectedRole === role.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {role.icon}
                </div>

                <CardTitle className="text-xl font-semibold mb-2">
                  {role.title}
                </CardTitle>

                <p className="text-gray-600 text-sm">
                  {role.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className={`h-4 w-4 mr-2 ${
                        selectedRole === role.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            {loading ? 'Setting up your account...' : 'Continue'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>

          {selectedRole && (
            <p className="mt-4 text-sm text-gray-600">
              You selected: <span className="font-semibold">
                {roles.find(r => r.id === selectedRole)?.title}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;