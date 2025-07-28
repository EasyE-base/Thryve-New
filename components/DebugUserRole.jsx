'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

const DebugUserRole = () => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)

  const fetchUserProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/debug/user-role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        
        if (data.profile && data.profile.role !== 'merchant') {
          toast.warning(`Role issue detected: Current role is '${data.profile.role}', but 'merchant' is required for studio owner access`)
        }
      } else {
        toast.error('Failed to fetch user profile')
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      toast.error('Error fetching profile')
    } finally {
      setLoading(false)
    }
  }

  const fixUserRole = async () => {
    if (!user) return

    setFixing(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/server-api/admin/fix-user-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newRole: 'merchant',
          businessName: 'Studio Owner'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Role updated to merchant successfully!')
        await fetchUserProfile() // Refresh profile data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fix role')
      }
    } catch (error) {
      console.error('Role fix error:', error)
      toast.error('Error fixing role')
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [user])

  if (!user) {
    return (
      <Alert className="bg-yellow-500/20 border-yellow-400/50">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          Please log in to view profile debug information
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Debug User Profile</h2>
        <Button 
          onClick={fetchUserProfile}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          Check Profile
        </Button>
      </div>

      {loading ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mr-3" />
              <span className="text-white">Loading profile data...</span>
            </div>
          </CardContent>
        </Card>
      ) : userProfile ? (
        <div className="space-y-4">
          {/* Basic User Info */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-blue-200 text-sm">Firebase UID:</span>
                  <p className="text-white font-mono text-sm break-all">{userProfile.uid}</p>
                </div>
                <div>
                  <span className="text-blue-200 text-sm">Email:</span>
                  <p className="text-white">{userProfile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile.profile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Profile Exists:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Yes
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Role:</span>
                    <Badge className={userProfile.profile.role === 'merchant' 
                      ? "bg-green-500/20 text-green-400 border-green-400/50" 
                      : "bg-red-500/20 text-red-400 border-red-400/50"
                    }>
                      {userProfile.profile.role || 'NOT SET'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Onboarding Complete:</span>
                    <Badge className={userProfile.profile.onboarding_complete 
                      ? "bg-green-500/20 text-green-400 border-green-400/50" 
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-400/50"
                    }>
                      {userProfile.profile.onboarding_complete ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  {userProfile.profile.studioName && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Studio Name:</span>
                      <span className="text-white">{userProfile.profile.studioName}</span>
                    </div>
                  )}
                  
                  {userProfile.profile.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Name:</span>
                      <span className="text-white">{userProfile.profile.name}</span>
                    </div>
                  )}

                  {/* Role Issue Detection */}
                  {userProfile.profile.role !== 'merchant' && (
                    <Alert className="bg-red-500/20 border-red-400/50">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-200">
                        <strong>Role Issue Detected:</strong> Your role is '{userProfile.profile.role}' but 'merchant' is required for studio owner access. This explains why you're seeing "Access denied" messages when trying to create classes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!userProfile.profile.onboarding_complete && (
                    <Alert className="bg-yellow-500/20 border-yellow-400/50">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-200">
                        <strong>Onboarding Incomplete:</strong> Your onboarding process is not complete. This may cause access issues.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert className="bg-red-500/20 border-red-400/50">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <strong>Profile Missing:</strong> No profile found in database. This explains access denied errors.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Fix Actions */}
          {userProfile.profile && userProfile.profile.role !== 'merchant' && (
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick Fix Actions
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Resolve role authorization issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/50">
                  <p className="text-blue-200 text-sm mb-3">
                    Click the button below to fix your role to 'merchant' which is required for studio owner access.
                  </p>
                  <Button 
                    onClick={fixUserRole}
                    disabled={fixing}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {fixing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Fixing Role...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Fix Role to Merchant
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {userProfile.profile && userProfile.profile.role === 'merchant' && (
            <Alert className="bg-green-500/20 border-green-400/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>Profile is correctly configured!</strong> You have the 'merchant' role and should be able to create classes and access studio owner features.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <Alert className="bg-yellow-500/20 border-yellow-400/50">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            Unable to load profile data. Please check your authentication and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default DebugUserRole