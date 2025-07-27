'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, CreditCard, MapPin, Clock, Users, CheckCircle, 
  Sparkles, TrendingUp, Globe, Zap, Info 
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function XPassPurchaseCard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const [purchaseHistory, setPurchaseHistory] = useState([])

  const xpassPackages = [
    {
      id: 'basic',
      name: 'Basic X Pass',
      credits: 5,
      price: 75,
      pricePerCredit: 15,
      popular: false,
      features: [
        'Use at any partner studio',
        '1 year expiry',
        'Book premium classes',
        'Cancel up to 2hrs before'
      ]
    },
    {
      id: 'standard',
      name: 'Standard X Pass',
      credits: 10,
      price: 140,
      pricePerCredit: 14,
      popular: true,
      savings: 'Save $10',
      features: [
        'Use at any partner studio',
        '1 year expiry',
        'Book premium classes',
        'Cancel up to 2hrs before',
        'Priority customer support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium X Pass',
      credits: 15,
      price: 195,
      pricePerCredit: 13,
      popular: false,
      savings: 'Save $30',
      features: [
        'Use at any partner studio',
        '1 year expiry',
        'Book premium classes',
        'Cancel up to 2hrs before',
        'Priority customer support',
        'Early access to new studios'
      ]
    }
  ]

  useEffect(() => {
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  const fetchUserCredits = async () => {
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/user/memberships`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserCredits(data.totalCredits || 0)
      }
    } catch (error) {
      console.error('Error fetching user credits:', error)
    }
  }

  const handlePurchase = async (packageType) => {
    if (!user) {
      toast.error('Please sign in to purchase X Pass credits')
      return
    }

    setLoading(true)
    try {
      const selectedPackage = xpassPackages.find(p => p.id === packageType)
      
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/user/purchase-xpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageType: packageType,
          credits: selectedPackage.credits,
          price: selectedPackage.price
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully purchased ${selectedPackage.credits} X Pass credits!`)
        await fetchUserCredits()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to purchase X Pass credits')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(error.message || 'Failed to purchase X Pass credits')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Credits */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-400/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-semibold">Your X Pass Credits</span>
              </div>
              <div className="text-3xl font-bold text-white">{userCredits}</div>
              <div className="text-purple-200 text-sm">credits remaining</div>
            </div>
            <div className="text-right">
              <Button 
                variant="outline" 
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => router.push('/my-bookings')}
              >
                View Bookings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* X Pass Benefits */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
            Why Choose Thryve X Pass?
          </CardTitle>
          <CardDescription className="text-blue-200">
            The flexible, fair way to try classes across our partner network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Use Anywhere</div>
                <div className="text-blue-200 text-sm">Access classes at any participating studio</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Fair Pricing</div>
                <div className="text-blue-200 text-sm">Studios keep 95% revenue vs 40% with ClassPass</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Flexible Booking</div>
                <div className="text-blue-200 text-sm">Cancel up to 2 hours before class</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Supporting Studios</div>
                <div className="text-blue-200 text-sm">Your purchase directly supports local businesses</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {xpassPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 ${
              pkg.popular ? 'ring-2 ring-yellow-400/50' : ''
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-white">{pkg.name}</CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">
                  {pkg.credits}
                  <span className="text-lg text-blue-200 font-normal"> credits</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${pkg.price}
                  <span className="text-sm text-blue-200 font-normal"> total</span>
                </div>
                <div className="text-blue-200 text-sm">
                  ${pkg.pricePerCredit} per credit
                </div>
                {pkg.savings && (
                  <Badge className="bg-green-500/20 text-green-200">
                    {pkg.savings}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-blue-200">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handlePurchase(pkg.id)}
                disabled={loading}
                className={`w-full text-white ${
                  pkg.popular 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {loading ? 'Processing...' : `Purchase ${pkg.credits} Credits`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How X Pass Works */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-400/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-400" />
            How X Pass Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">1. Purchase</h3>
              <p className="text-blue-200 text-sm">Buy a credit pack that fits your needs</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">2. Explore</h3>
              <p className="text-blue-200 text-sm">Find classes at any participating studio</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">3. Book</h3>
              <p className="text-blue-200 text-sm">Use credits to book classes instantly</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">4. Enjoy</h3>
              <p className="text-blue-200 text-sm">Attend your class and support local studios</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fair Revenue Model */}
      <Card className="bg-green-500/10 border border-green-400/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Supporting Local Studios</h3>
              <p className="text-green-200 text-sm mb-3">
                Unlike ClassPass (which takes 50-60% revenue), Thryve only takes 5% when you use X Pass credits. 
                This means studios keep 95% of revenue, allowing them to provide better classes and fair instructor pay.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-green-300">
                  <strong>ClassPass:</strong> Studios keep 40-50%
                </div>
                <div className="text-green-300">
                  <strong>Thryve X Pass:</strong> Studios keep 95%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}