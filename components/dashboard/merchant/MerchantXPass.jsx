'use client'

import { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Zap, DollarSign, Users, TrendingUp, Settings, 
  Eye, Edit, Star, MapPin, Clock, CheckCircle,
  AlertCircle, Plus, BarChart3, Target, Award
} from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/ChartComponents'
import { toast } from 'sonner'

// ✅ MERCHANT X PASS MANAGEMENT
export default function MerchantXPass() {
  const { studio, xPassData, loading, refreshData } = useDashboard()
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState({
    enabled: xPassData?.enabled || false,
    introDiscount: xPassData?.introDiscount || 20,
    description: xPassData?.description || '',
    specialOffers: xPassData?.specialOffers || [],
    availability: xPassData?.availability || 'all_classes',
    maxBookingsPerMonth: xPassData?.maxBookingsPerMonth || 10,
    featureInSearch: xPassData?.featureInSearch || true,
    autoAcceptBookings: xPassData?.autoAcceptBookings || true
  })

  // ✅ TOGGLE X PASS ENABLED
  const handleToggleXPass = async (enabled) => {
    try {
      const response = await fetch('/api/xpass/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, enabled }))
        toast.success(enabled ? 'X Pass enabled!' : 'X Pass disabled')
        refreshData()
      } else {
        throw new Error('Failed to update X Pass settings')
      }
    } catch (error) {
      toast.error('Failed to update X Pass settings')
    }
  }

  // ✅ SAVE X PASS SETTINGS
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/xpass/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('X Pass settings saved!')
        setIsEditing(false)
        refreshData()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save X Pass settings')
    }
  }

  // ✅ MOCK DATA FOR DEMONSTRATION
  const xPassStats = {
    monthlyBookings: xPassData?.monthlyBookings || 47,
    monthlyRevenue: xPassData?.monthlyRevenue || 1250,
    totalBookings: xPassData?.totalBookings || 156,
    averageRating: xPassData?.averageRating || 4.8,
    newCustomers: xPassData?.newCustomers || 23,
    revenueGrowth: xPassData?.revenueGrowth || 12
  }

  const recentBookings = [
    { id: 1, customer: 'Emma Wilson', class: 'Yoga Flow', date: '2024-01-15', rating: 5 },
    { id: 2, customer: 'Mike Chen', class: 'HIIT Training', date: '2024-01-15', rating: 4 },
    { id: 3, customer: 'Sarah Johnson', class: 'Pilates', date: '2024-01-14', rating: 5 },
    { id: 4, customer: 'David Kim', class: 'Boxing', date: '2024-01-14', rating: 4 },
    { id: 5, customer: 'Lisa Brown', class: 'Yoga Flow', date: '2024-01-13', rating: 5 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">X Pass Management</h1>
          <p className="text-gray-600">Manage your cross-studio booking participation</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Label htmlFor="xpass-toggle" className="text-sm font-medium">
            X Pass {settings.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="xpass-toggle"
            checked={settings.enabled}
            onCheckedChange={handleToggleXPass}
          />
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-0 shadow-sm ${settings.enabled ? 'bg-gradient-to-r from-orange-50 to-orange-100' : 'bg-gray-50'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.enabled 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-400 text-white'
              }`}>
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {settings.enabled ? 'X Pass Active' : 'X Pass Inactive'}
                </h3>
                <p className="text-sm text-gray-600">
                  {settings.enabled 
                    ? 'Your studio is accepting X Pass bookings' 
                    : 'Enable X Pass to start receiving cross-studio bookings'
                  }
                </p>
              </div>
            </div>
            
            {settings.enabled && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {settings.enabled ? (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monthly Bookings
                </CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{xPassStats.monthlyBookings}</div>
                <p className="text-xs text-gray-500">X Pass bookings this month</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Monthly Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${xPassStats.monthlyRevenue}</div>
                <p className="text-xs text-gray-500">
                  <span className="text-green-600">+{xPassStats.revenueGrowth}%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{xPassStats.averageRating}</div>
                <p className="text-xs text-gray-500">From X Pass customers</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  New Customers
                </CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{xPassStats.newCustomers}</div>
                <p className="text-xs text-gray-500">Via X Pass this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <RevenueChart 
              data={xPassData?.chartData || []} 
              loading={loading}
              title="X Pass Revenue Trend"
            />

            {/* Settings Panel */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>X Pass Settings</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Intro Discount */}
                    <div className="space-y-2">
                      <Label>Intro Discount for New Customers (%)</Label>
                      <Slider
                        value={[settings.introDiscount]}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, introDiscount: value[0] }))}
                        max={50}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500">
                        Current: {settings.introDiscount}% off first X Pass booking
                      </div>
                    </div>

                    {/* Studio Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Studio Description for X Pass</Label>
                      <Textarea
                        id="description"
                        value={settings.description}
                        onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your studio for X Pass users..."
                        rows={3}
                      />
                    </div>

                    {/* Class Availability */}
                    <div className="space-y-2">
                      <Label>X Pass Availability</Label>
                      <Select 
                        value={settings.availability} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, availability: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_classes">All Classes</SelectItem>
                          <SelectItem value="specific_classes">Specific Classes Only</SelectItem>
                          <SelectItem value="off_peak">Off-Peak Hours Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Monthly Booking Limit */}
                    <div className="space-y-2">
                      <Label>Max X Pass Bookings per Month</Label>
                      <Input
                        type="number"
                        value={settings.maxBookingsPerMonth}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxBookingsPerMonth: parseInt(e.target.value) }))}
                        min={1}
                        max={100}
                      />
                    </div>

                    {/* Feature Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="feature-search">Feature in X Pass Search</Label>
                        <Switch
                          id="feature-search"
                          checked={settings.featureInSearch}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, featureInSearch: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-accept">Auto-Accept Bookings</Label>
                        <Switch
                          id="auto-accept"
                          checked={settings.autoAcceptBookings}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAcceptBookings: checked }))}
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <Button 
                      onClick={handleSaveSettings} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      Save X Pass Settings
                    </Button>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Intro Discount</span>
                        <span className="font-medium">{settings.introDiscount}%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Availability</span>
                        <span className="font-medium capitalize">
                          {settings.availability.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Limit</span>
                        <span className="font-medium">{settings.maxBookingsPerMonth} bookings</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Featured in Search</span>
                        <Badge variant={settings.featureInSearch ? "default" : "secondary"}>
                          {settings.featureInSearch ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Auto-Accept</span>
                        <Badge variant={settings.autoAcceptBookings ? "default" : "secondary"}>
                          {settings.autoAcceptBookings ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent X Pass Bookings */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent X Pass Bookings</CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">{booking.customer}</div>
                        <div className="text-sm text-gray-500">
                          {booking.class} • {booking.date}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{booking.rating}</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700">
                        X Pass
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* X Pass Disabled - Benefits Section */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-500" />
                <span>X Pass Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Attract New Customers</div>
                    <div className="text-sm text-gray-600">
                      Reach fitness enthusiasts from other studios in your area
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Low Platform Fee</div>
                    <div className="text-sm text-gray-600">
                      Only 5-10% commission vs 50% on other platforms
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Fill Empty Slots</div>
                    <div className="text-sm text-gray-600">
                      Maximize revenue from underbooked classes
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Easy Management</div>
                    <div className="text-sm text-gray-600">
                      Control availability, pricing, and customer experience
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => handleToggleXPass(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Enable X Pass
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>How X Pass Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Customers Buy X Pass</div>
                    <div className="text-sm text-gray-600">
                      They purchase credits that work at multiple studios
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium">They Discover Your Studio</div>
                    <div className="text-sm text-gray-600">
                      Your classes appear in X Pass search results
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium">They Book & Attend</div>
                    <div className="text-sm text-gray-600">
                      Seamless booking experience for cross-studio visits
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-green-600">4</span>
                  </div>
                  <div>
                    <div className="font-medium">You Get Paid</div>
                    <div className="text-sm text-gray-600">
                      Automatic payment processing with low platform fees
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}