'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Search } from 'lucide-react'

export default function MerchantMarketplace() {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5" /> Instructor Marketplace
          </CardTitle>
          <Link href="/marketplace">
            <Button size="sm" className="bg-[#1E90FF] hover:bg-blue-600">Open Marketplace</Button>
          </Link>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          Discover, invite, and manage instructors. Use the dedicated marketplace page for full search and filters.
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/marketplace">
              <Button variant="outline">Browse Instructors</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


