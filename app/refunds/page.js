'use client'

import Link from 'next/link'

export default function RefundsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Refunds & No-Show Policy</h1>
      <p className="mt-4 text-gray-700">
        Studios on Thryve manage their own refund, cancellation, and no-show policies. Policies vary by studio and class.
      </p>
      <div className="mt-6 space-y-4 text-gray-700">
        <p>
          • No-show or late cancellation may result in forfeited credits and/or a studio fee, as indicated by the studio’s policy.
        </p>
        <p>
          • For refund requests, please contact the hosting studio directly via their listed contact information on the class page.
        </p>
        <p>
          • If you need help reaching a studio, contact Thryve Support and include your booking details.
        </p>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">Return to homepage</Link>
      </div>
    </div>
  )
}


