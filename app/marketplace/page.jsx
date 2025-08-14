'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/session/sync')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Marketplace</h1>
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              Welcome to the marketplace, {user.email}! {user.role && ` Your role: ${user.role}`}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Fitness Classes</h3>
            <p className="text-gray-600 mb-4">Browse and book fitness classes from top instructors and studios.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">Browse Classes</button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Personal Training</h3>
            <p className="text-gray-600 mb-4">Connect with certified personal trainers for one-on-one sessions.</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">Find Trainers</button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">Nutrition Plans</h3>
            <p className="text-gray-600 mb-4">Discover personalized nutrition plans and meal prep services.</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">View Plans</button>
          </div>
          {user && (user.role === 'merchant' || user.role === 'instructor') && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-200">
              <h3 className="text-xl font-semibold mb-3">Merchant Dashboard</h3>
              <p className="text-gray-600 mb-4">Manage your services, bookings, and earnings.</p>
              <button onClick={() => router.push('/dashboard')} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">Go to Dashboard</button>
            </div>
          )}
        </div>
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Featured Offerings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold">Premium Yoga Studio Access</h4>
              <p className="text-sm text-gray-600 mt-1">Unlimited access to premium yoga classes across the city.</p>
              <span className="text-green-600 font-semibold">$99/month</span>
            </div>
            <div className="bg-white rounded p-4">
              <h4 className="font-semibold">HIIT Training Package</h4>
              <p className="text-sm text-gray-600 mt-1">High-intensity interval training with certified instructors.</p>
              <span className="text-green-600 font-semibold">$149/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


