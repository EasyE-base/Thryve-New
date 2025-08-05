'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, X, Bell, Search, LogOut, User, Settings, 
  Home, Calendar, BarChart3, Users, MessageSquare,
  Building2, Dumbbell, CreditCard, Zap, HelpCircle
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { signOut } from '@/lib/firebase-auth'
import { useDashboard } from '@/contexts/DashboardContext'
import { toast } from 'sonner'
import Link from 'next/link'

// ✅ RESPONSIVE NAVIGATION LAYOUT
export default function DashboardLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { activeSection, updateSection, notifications, refreshData } = useDashboard()

  // ✅ ROLE-SPECIFIC NAVIGATION
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
    ]

    switch (role) {
      case 'merchant':
        return [
          ...baseItems,
          { id: 'classes', label: 'Classes', icon: Dumbbell },
          { id: 'instructors', label: 'Instructors', icon: Users },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'xpass', label: 'X Pass', icon: Zap },
          { id: 'settings', label: 'Settings', icon: Settings },
        ]
      
      case 'instructor':
        return [
          ...baseItems,
          { id: 'schedule', label: 'My Schedule', icon: Calendar },
          { id: 'earnings', label: 'Earnings', icon: CreditCard },
          { id: 'swaps', label: 'Shift Swaps', icon: Users },
          { id: 'profile', label: 'Profile', icon: User },
        ]
      
      case 'customer':
        return [
          ...baseItems,
          { id: 'bookings', label: 'My Bookings', icon: Calendar },
          { id: 'discover', label: 'Discover', icon: Search },
          { id: 'xpass', label: 'X Pass', icon: Zap },
          { id: 'profile', label: 'Profile', icon: User },
        ]
      
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  // ✅ CLOSE MOBILE MENU ON SECTION CHANGE
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeSection])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ MOBILE HEADER */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1E90FF] to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Thryve</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                {notifications.length}
              </Badge>
            )}
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-[#1E90FF] text-white">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex">
        {/* ✅ DESKTOP SIDEBAR */}
        <aside className={`
          hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}
          transition-all duration-300
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1E90FF] to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              {sidebarOpen && (
                <span className="font-bold text-xl text-gray-900">Thryve</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => updateSection(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#1E90FF] text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {sidebarOpen ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL} />
                    <AvatarFallback className="bg-[#1E90FF] text-white">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {role}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="flex-1"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button variant="ghost" size="sm" onClick={() => updateSection('settings')}>
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ✅ MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            
            <aside className="relative flex flex-col w-64 bg-white border-r border-gray-200">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1E90FF] to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">Thryve</span>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => updateSection(item.id)}
                      className={`
                        w-full flex items-center px-3 py-2 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-[#1E90FF] text-white' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="ml-3 font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL} />
                      <AvatarFallback className="bg-[#1E90FF] text-white">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate capitalize">
                        {role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="flex-1"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ✅ MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {role} Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={refreshData}>
                <Search className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback className="bg-[#1E90FF] text-white">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}