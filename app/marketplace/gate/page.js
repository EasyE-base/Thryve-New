'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketplaceGatePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Marketplace Access</h1>
      <p className="mt-4 text-gray-700">
        The Marketplace is available for studio owners to discover and collaborate with instructors.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/signup?role=merchant&next=/marketplace">
          <Button className="bg-gray-900 hover:bg-black text-white">I’m a Studio Owner</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go back</Button>
        </Link>
      </div>
      <p className="mt-6 text-sm text-gray-500">Instructors can control marketplace visibility in settings.</p>
    </div>
  )
}


