'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  CreditCard,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const Navigation = ({ userRole = 'customer' }) => {
  const pathname = usePathname()

  const getNavigationItems = () => {
    const baseItems = [
      {
        href: '/',
        label: 'Home',
        icon: Home,
      },
      {
        href: '/marketplace',
        label: 'Classes',
        icon: Calendar,
      }
    ]

    if (userRole === 'instructor') {
      return [
        ...baseItems,
        {
          href: '/dashboard/instructor',
          label: 'Dashboard',
          icon: BarChart3,
        },
        {
          href: '/instructor-payouts',
          label: 'Payouts',
          icon: DollarSign,
          badge: 'New',
          badgeVariant: 'default'
        },
        {
          href: '/studio/create-class',
          label: 'Create Class',
          icon: Calendar,
        },
        {
          href: '/settings',
          label: 'Settings',
          icon: Settings,
        }
      ]
    }

    if (userRole === 'merchant') {
      return [
        ...baseItems,
        {
          href: '/dashboard/merchant',
          label: 'Dashboard',
          icon: BarChart3,
        },
        {
          href: '/studio-payouts',
          label: 'Instructor Payouts',
          icon: CreditCard,
          badge: 'New',
          badgeVariant: 'default'
        },
        {
          href: '/dashboard/merchant/staff',
          label: 'Staff',
          icon: Users,
        },
        {
          href: '/studio/create-class',
          label: 'Create Class',
          icon: Calendar,
        },
        {
          href: '/settings',
          label: 'Settings',
          icon: Settings,
        }
      ]
    }

    // Default customer navigation
    return [
      ...baseItems,
      {
        href: '/dashboard/customer',
        label: 'Dashboard',
        icon: BarChart3,
      },
      {
        href: '/my-bookings',
        label: 'My Bookings',
        icon: Calendar,
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
      }
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || 'secondary'} 
                  className="ml-1 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile Navigation Component
export const MobileNavigation = ({ userRole = 'customer' }) => {
  const pathname = usePathname()

  const getNavigationItems = () => {
    const baseItems = [
      {
        href: '/',
        label: 'Home',
        icon: Home,
      },
      {
        href: '/marketplace',
        label: 'Classes',
        icon: Calendar,
      }
    ]

    if (userRole === 'instructor') {
      return [
        ...baseItems,
        {
          href: '/dashboard/instructor',
          label: 'Dashboard',
          icon: BarChart3,
        },
        {
          href: '/instructor-payouts',
          label: 'Payouts',
          icon: DollarSign,
        }
      ]
    }

    if (userRole === 'merchant') {
      return [
        ...baseItems,
        {
          href: '/dashboard/merchant',
          label: 'Dashboard',
          icon: BarChart3,
        },
        {
          href: '/studio-payouts',
          label: 'Payouts',
          icon: CreditCard,
        }
      ]
    }

    // Default customer navigation
    return [
      ...baseItems,
      {
        href: '/dashboard/customer',
        label: 'Dashboard',
        icon: BarChart3,
      },
      {
        href: '/my-bookings',
        label: 'Bookings',
        icon: Calendar,
      }
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-2 px-3",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Navigation