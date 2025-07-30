'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { signOut } from '../../../lib/firebase-auth'
import Navigation from '../Navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { 
  User, 
  Settings, 
  LogOut, 
  Menu,
  DollarSign,
  CreditCard,
  BarChart3
} from 'lucide-react'

const Header = () => {
  const [user, loading] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Fetch user profile to determine role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/firebase-user?uid=${user.uid}`)
          if (response.ok) {
            const profile = await response.json()
            setUserProfile(profile)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getPayoutLink = () => {
    if (userProfile?.role === 'instructor') {
      return '/instructor-payouts'
    } else if (userProfile?.role === 'merchant') {
      return '/studio-payouts'
    }
    return null
  }

  const getPayoutLabel = () => {
    if (userProfile?.role === 'instructor') {
      return 'My Payouts'
    } else if (userProfile?.role === 'merchant') {
      return 'Instructor Payouts'
    }
    return 'Payouts'
  }

  const getPayoutIcon = () => {
    if (userProfile?.role === 'instructor') {
      return DollarSign
    } else if (userProfile?.role === 'merchant') {
      return CreditCard
    }
    return DollarSign
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-xl">Thryve</span>
          {userProfile?.role && (
            <Badge variant="outline" className="ml-2">
              {userProfile.role}
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation */}
        <Navigation userRole={userProfile?.role} />

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.displayName || user.email}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    {userProfile?.role && (
                      <Badge variant="outline" className="w-fit">
                        {userProfile.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* Dashboard Link */}
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${userProfile?.role || 'customer'}`}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>

                {/* Payout Link (for instructors and merchants) */}
                {getPayoutLink() && (
                  <DropdownMenuItem asChild>
                    <Link href={getPayoutLink()}>
                      {React.createElement(getPayoutIcon(), { className: "mr-2 h-4 w-4" })}
                      <span>{getPayoutLabel()}</span>
                      <Badge variant="secondary" className="ml-auto">
                        New
                      </Badge>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/">
              <Button size="sm">Sign In</Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-2">
            <Navigation userRole={userProfile?.role} />
          </div>
        </div>
      )}
    </header>
  )
}

export default Header