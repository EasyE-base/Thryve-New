'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'

export default function ProfileStep({ 
  data, 
  onUpdate, 
  businessTypes,
  isValid 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal & Business Information</h2>
        <p className="text-gray-600">Tell us about yourself and your fitness business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onUpdate('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onUpdate('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate('phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessEmail">Business Email</Label>
          <Input
            id="businessEmail"
            type="email"
            value={data.businessEmail}
            onChange={(e) => onUpdate('businessEmail', e.target.value)}
            placeholder="info@yourstudio.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={data.businessName}
          onChange={(e) => onUpdate('businessName', e.target.value)}
          placeholder="Enter your business name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Business Type *</Label>
        <select
          id="businessType"
          value={data.businessType}
          onChange={(e) => onUpdate('businessType', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          required
        >
          <option value="">Select business type</option>
          {businessTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Validation feedback */}
      {!isValid && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          Please fill in all required fields to continue.
        </div>
      )}
    </div>
  )
}