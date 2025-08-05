'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { MapPin } from 'lucide-react'

export default function LocationStep({ 
  data, 
  onUpdate, 
  onAmenitiesUpdate,
  amenityOptions,
  isValid 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-[#1E90FF] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Location & Facility Details</h2>
        <p className="text-gray-600">Where is your business located and what do you offer?</p>
      </div>

      {/* ✅ ISOLATED: Address fields in separate container */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <h3 className="font-semibold text-blue-900 mb-3">Studio Address</h3>
        
        <div className="space-y-2 mb-4">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => onUpdate('address', e.target.value)}
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onUpdate('city', e.target.value)}
              placeholder="City"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={data.state}
              onChange={(e) => onUpdate('state', e.target.value)}
              placeholder="State"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">Zip Code *</Label>
            <Input
              id="zipCode"
              value={data.zipCode}
              onChange={(e) => onUpdate('zipCode', e.target.value)}
              placeholder="12345"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Describe your business, what makes it special, and what clients can expect..."
          className="min-h-[100px]"
        />
      </div>

      {/* ✅ ISOLATED: Amenities in separate container to prevent state conflicts */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <Label className="text-base font-medium">Amenities & Features</Label>
        <p className="text-sm text-gray-600 mb-3">Select all that apply (optional)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenityOptions.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={data.amenities.includes(amenity)}
                onCheckedChange={() => onAmenitiesUpdate(amenity)}
              />
              <Label htmlFor={amenity} className="text-sm">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Total Facility Capacity</Label>
        <div className="mt-3">
          <Slider
            value={data.capacity}
            onValueChange={(value) => onUpdate('capacity', value)}
            max={500}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>10</span>
            <span className="font-medium text-[#1E90FF]">
              {data.capacity[0]} people
            </span>
            <span>500+</span>
          </div>
        </div>
      </div>

      {/* Validation feedback */}
      {!isValid && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          Please fill in all required address fields to continue.
        </div>
      )}

      {/* Success feedback */}
      {isValid && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          ✓ Address information complete. You can add amenities or proceed to the next step.
        </div>
      )}
    </div>
  )
}