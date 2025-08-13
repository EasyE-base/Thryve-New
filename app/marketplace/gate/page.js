'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

export default function MarketplaceGatePage() {
  const router = useRouter()
  const { user, role } = useAuth()

  // Auto-bypass gate for studio/merchant
  useEffect(() => {
    if (!user) return
    if (role === 'studio' || role === 'merchant') {
      router.replace('/marketplace')
    }
  }, [user, role, router])

  const handleStudioOwner = async () => {
    try {
      if (user) {
        // If the user is logged in, ensure role is studio/merchant and route to merchant onboarding/dashboard
        const { doc, updateDoc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        const currentRole = snap.exists() ? snap.data().role : null
        if (currentRole === 'studio' || currentRole === 'merchant') {
          // Already a studio/merchant – send straight to marketplace
          router.push('/marketplace')
        } else {
          // First-time selection – mark as studio owner and go to onboarding to complete profile
          await updateDoc(ref, { role: 'studio', roleSelectedAt: new Date(), onboardingStatus: 'started' })
          router.push('/onboarding/merchant')
        }
      } else {
        // Not logged in: take them to signup prefilled as studio owner
        router.push('/signup?role=studio&next=/marketplace')
      }
    } catch (_) {
      router.push('/signup?role=studio&next=/marketplace')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Marketplace Access</h1>
      <p className="mt-4 text-gray-700">
        The Marketplace is available for studio owners to discover and collaborate with instructors.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={handleStudioOwner} className="bg-gray-900 hover:bg-black text-white">I’m a Studio Owner</Button>
        <Link href="/">
          <Button variant="outline">Go back</Button>
        </Link>
      </div>
      <p className="mt-6 text-sm text-gray-500">Instructors can control marketplace visibility in settings.</p>
    </div>
  )
}


