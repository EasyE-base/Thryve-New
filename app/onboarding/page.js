'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Role selection, 2: Profile creation
  const [selectedRole, setSelectedRole] = useState('')
  const [profileData, setProfileData] = useState({})

  useEffect(() => {
    if (!loading) {
      // Redirect if not authenticated
      if (!user) {
        router.push('/signin')
        return
      }
      
      // Redirect if already completed onboarding
      if (userProfile?.role && userProfile?.profileCompleted) {
        router.push(`/dashboard/${userProfile.role}`)
        return
      }
    }
  }, [user, userProfile, loading, router])

  const handleRoleSelection = async (role) => {
    setSelectedRole(role)
    
    // Update user profile with selected role
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        role: role,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      setStep(2)
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleProfileCompletion = async () => {
    try {
      // Update user profile
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        role: selectedRole,
        profileCompleted: true,
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      // Create role-specific profile
      const roleCollection = selectedRole + 's' // customers, instructors, merchants
      await setDoc(doc(db, roleCollection, user.uid), {
        uid: user.uid,
        ...profileData,
        createdAt: serverTimestamp()
      })
      
      // Redirect to dashboard
      router.push(`/dashboard/${selectedRole}`)
    } catch (error) {
      console.error('Error completing profile:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Welcome to Thryve!</h1>
            <p className="text-gray-600">Choose your role to get started</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => handleRoleSelection('customer')}>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
                <CardDescription>Book classes and manage your fitness journey</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Book fitness classes</li>
                  <li>• Track your progress</li>
                  <li>• Connect with instructors</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => handleRoleSelection('instructor')}>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
                <CardDescription>Teach classes and manage your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Create and manage classes</li>
                  <li>• Set your schedule</li>
                  <li>• Connect with students</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => handleRoleSelection('merchant')}>
              <CardHeader>
                <CardTitle>Studio Owner</CardTitle>
                <CardDescription>Manage your studio and instructors</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Manage studio operations</li>
                  <li>• Oversee instructors</li>
                  <li>• Handle bookings and payments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>Tell us more about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <RoleSpecificForm 
                role={selectedRole}
                profileData={profileData}
                setProfileData={setProfileData}
                onComplete={handleProfileCompletion}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}

// Role-specific form component
function RoleSpecificForm({ role, profileData, setProfileData, onComplete }) {
  const renderForm = () => {
    switch (role) {
      case 'customer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full p-2 border rounded"
                value={profileData.phone || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fitness Goals</label>
              <textarea
                className="w-full p-2 border rounded"
                value={profileData.fitnessGoals || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, fitnessGoals: e.target.value }))}
              />
            </div>
          </div>
        )
      
      case 'instructor':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Specializations</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="e.g., Yoga, Pilates, Strength Training"
                value={profileData.specializations || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, specializations: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Certifications</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={profileData.certifications || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, certifications: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={profileData.hourlyRate || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              />
            </div>
          </div>
        )
      
      case 'merchant':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Studio Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={profileData.studioName || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, studioName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={profileData.address || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Studio Type</label>
              <select
                className="w-full p-2 border rounded"
                value={profileData.studioType || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, studioType: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="yoga">Yoga Studio</option>
                <option value="gym">Gym</option>
                <option value="pilates">Pilates Studio</option>
                <option value="crossfit">CrossFit Box</option>
                <option value="martial_arts">Martial Arts</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div>
      {renderForm()}
      <Button 
        className="w-full mt-6" 
        onClick={onComplete}
      >
        Complete Profile
      </Button>
    </div>
  )
}