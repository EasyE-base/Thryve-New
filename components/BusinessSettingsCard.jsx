'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, Settings, Users, CreditCard, Clock, AlertTriangle, 
  CheckCircle, Info, Star, TrendingUp, Calendar, MapPin 
} from 'lucide-react'
import { toast } from 'sonner'

export default function BusinessSettingsCard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [xpassSettings, setXpassSettings] = useState({
    xpassEnabled: false,
    acceptedClassTypes: [],
    cancellationWindow: 2,
    noShowFee: 15,
    lateCancelFee: 10
  })

  const classTypes = ['Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Cardio', 'Dance', 'Martial Arts', 'Meditation']

  useEffect(() => {
    fetchXPassSettings()
  }, [user])

  const fetchXPassSettings = async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/studio/xpass-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setXpassSettings(data)
      }
    } catch (error) {
      console.error('Error fetching X Pass settings:', error)
    }
  }

  const handleSettingChange = (field, value) => {
    setXpassSettings(prev => ({ ...prev, [field]: value }))
  }

  const toggleClassType = (classType) => {
    setXpassSettings(prev => ({
      ...prev,
      acceptedClassTypes: prev.acceptedClassTypes.includes(classType)
        ? prev.acceptedClassTypes.filter(type => type !== classType)
        : [...prev.acceptedClassTypes, classType]
    }))
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/studio/xpass-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(xpassSettings)
      })

      if (response.ok) {
        toast.success('Business settings updated successfully!')
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Platform Revenue Model */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-400/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
            Thryve Revenue Model
          </CardTitle>
          <CardDescription className="text-green-200">
            Transparent, fair pricing that grows with your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-200 text-sm">Platform Fee</span>
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">3.75%</div>
              <div className="text-green-300 text-xs">Per transaction</div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-200 text-sm">X Pass Fee</span>
                <Star className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">5%</div>
              <div className="text-blue-300 text-xs">Cross-studio redemption</div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-200 text-sm">Your Revenue</span>
                <CheckCircle className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">91-96%</div>
              <div className="text-purple-300 text-xs">You keep most</div>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="text-blue-200 font-medium mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Why Thryve is Better
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="text-blue-300">• ClassPass takes 50-60% revenue</div>
              <div className="text-blue-300">• Thryve takes only 5% on X Pass</div>
              <div className="text-blue-300">• No hidden fees or surprises</div>
              <div className="text-blue-300">• You control your pricing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* X Pass Settings */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-400" />
            Thryve X Pass Settings
          </CardTitle>
          <CardDescription className="text-blue-200">
            Accept X Pass credits from customers across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* X Pass Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <div className="text-white font-medium">Accept X Pass Credits</div>
              <div className="text-blue-200 text-sm">
                Allow customers to use X Pass credits at your studio
              </div>
            </div>
            <Switch
              checked={xpassSettings.xpassEnabled}
              onCheckedChange={(checked) => handleSettingChange('xpassEnabled', checked)}
            />
          </div>

          {xpassSettings.xpassEnabled && (
            <>
              {/* Class Type Selection */}
              <div className="space-y-3">
                <Label className="text-white">Eligible Class Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {classTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={xpassSettings.acceptedClassTypes.includes(type)}
                        onChange={() => toggleClassType(type)}
                        className="rounded border-white/20 bg-white/10 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-blue-200 text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Revenue Projection */}
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                <h4 className="text-yellow-200 font-medium mb-2">Revenue Impact</h4>
                <div className="text-sm text-yellow-300">
                  • X Pass brings new customers to your studio
                  • 95% revenue share (vs 40-50% with ClassPass)
                  • No minimum commitments or quotas
                  • You control which classes accept X Pass
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancellation & No-Show Policy */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
            Cancellation & No-Show Policy
          </CardTitle>
          <CardDescription className="text-blue-200">
            Set your studio's cancellation rules and penalty fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationWindow" className="text-white">Cancellation Window</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="cancellationWindow"
                  type="number"
                  value={xpassSettings.cancellationWindow}
                  onChange={(e) => handleSettingChange('cancellationWindow', parseInt(e.target.value))}
                  min="0"
                  max="24"
                  className="bg-white/10 border-white/20 text-white"
                />
                <span className="text-blue-200 text-sm">hours</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lateCancelFee" className="text-white">Late Cancel Fee</Label>
              <div className="flex items-center space-x-2">
                <span className="text-blue-200">$</span>
                <Input
                  id="lateCancelFee"
                  type="number"
                  value={xpassSettings.lateCancelFee}
                  onChange={(e) => handleSettingChange('lateCancelFee', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="noShowFee" className="text-white">No-Show Fee</Label>
              <div className="flex items-center space-x-2">
                <span className="text-blue-200">$</span>
                <Input
                  id="noShowFee"
                  type="number"
                  value={xpassSettings.noShowFee}
                  onChange={(e) => handleSettingChange('noShowFee', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </div>

          {/* Policy Explanation */}
          <div className="bg-orange-500/10 border border-orange-400/20 rounded-lg p-4">
            <h4 className="text-orange-200 font-medium mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              How It Works
            </h4>
            <div className="space-y-2 text-sm">
              <div className="text-orange-300">
                <strong>Class Pack Users:</strong> Credit deducted + fee applied
              </div>
              <div className="text-orange-300">
                <strong>Unlimited Members:</strong> Fee applied only (no credit deduction)
              </div>
              <div className="text-orange-300">
                <strong>X Pass Users:</strong> Credit deducted + fee applied
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Plans */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-400" />
            Business Plan Tiers
          </CardTitle>
          <CardDescription className="text-blue-200">
            Current plan and available upgrades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <Badge className="bg-green-500/20 text-green-200 mb-3">Current Plan</Badge>
              <h3 className="text-white font-semibold mb-2">Starter</h3>
              <div className="text-2xl font-bold text-white mb-2">$29<span className="text-sm text-blue-200">/mo</span></div>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Core scheduling</li>
                <li>• Payment processing</li>
                <li>• Class packs</li>
                <li>• Basic dashboard</li>
                <li>• 3.75% transaction fee</li>
              </ul>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-blue-400/30">
              <Badge className="bg-blue-500/20 text-blue-200 mb-3">Upgrade</Badge>
              <h3 className="text-white font-semibold mb-2">Business+</h3>
              <div className="text-2xl font-bold text-white mb-2">$59<span className="text-sm text-blue-200">/mo</span></div>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Everything in Starter</li>
                <li>• Advanced analytics</li>
                <li>• Loyalty programs</li>
                <li>• Staff management</li>
                <li>• Same 3.75% fee</li>
              </ul>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-purple-400/30">
              <Badge className="bg-purple-500/20 text-purple-200 mb-3">Premium</Badge>
              <h3 className="text-white font-semibold mb-2">Enterprise</h3>
              <div className="text-2xl font-bold text-white mb-2">Custom</div>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Everything in Business+</li>
                <li>• VIP onboarding</li>
                <li>• Custom integrations</li>
                <li>• Multi-location tools</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8"
        >
          {loading ? 'Saving...' : 'Save Business Settings'}
        </Button>
      </div>
    </div>
  )
}