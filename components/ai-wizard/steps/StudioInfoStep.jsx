'use client'

import { useCallback } from 'react'

// ✅ EXTRACTED: Studio information step
const STUDIO_TYPES = [
  'Yoga Studio',
  'Pilates Studio', 
  'CrossFit Box',
  'Dance Studio',
  'Martial Arts Dojo',
  'Barre Studio',
  'Cycling Studio',
  'General Fitness',
  'Boutique Fitness',
  'Wellness Center'
]

const TARGET_AUDIENCES = [
  'Beginners',
  'Intermediate',
  'Advanced',
  'Seniors',
  'Young Adults',
  'Families',
  'Athletes',
  'Rehabilitation',
  'Corporate',
  'Mixed Levels'
]

const SPECIALTY_OPTIONS = [
  'Hot Yoga',
  'Aerial Yoga',
  'Prenatal Classes',
  'Meditation',
  'Strength Training',
  'Cardio',
  'Flexibility',
  'Rehabilitation',
  'Sports Specific',
  'Mind-Body Connection',
  'Nutrition Counseling',
  'Personal Training'
]

const EQUIPMENT_OPTIONS = [
  'Yoga Mats',
  'Blocks & Props',
  'Resistance Bands',
  'Dumbbells',
  'Kettlebells',
  'Barbell & Plates',
  'Cardio Machines',
  'Sound System',
  'Mirrors',
  'Storage',
  'Changing Rooms',
  'Shower Facilities'
]

export default function StudioInfoStep({ studioData, onUpdateData }) {
  // ✅ CALLBACK: Handle input changes
  const handleInputChange = useCallback((field, value) => {
    onUpdateData(prev => ({ ...prev, [field]: value }))
  }, [onUpdateData])

  // ✅ CALLBACK: Handle array changes (checkboxes)
  const handleArrayChange = useCallback((field, value, checked) => {
    onUpdateData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }, [onUpdateData])

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Studio Name</label>
          <input
            type="text"
            value={studioData.studioName}
            onChange={(e) => handleInputChange('studioName', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your studio name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Studio Type</label>
          <select
            value={studioData.studioType}
            onChange={(e) => handleInputChange('studioType', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select studio type</option>
            {STUDIO_TYPES.map(type => (
              <option key={type} value={type} className="text-gray-800">{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Location</label>
          <input
            type="text"
            value={studioData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="City, State or Region"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
          <select
            value={studioData.targetAudience}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select primary audience</option>
            {TARGET_AUDIENCES.map(audience => (
              <option key={audience} value={audience} className="text-gray-800">{audience}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Experience Level</label>
          <select
            value={studioData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select your experience</option>
            <option value="first-time" className="text-gray-800">First-time studio owner</option>
            <option value="some-experience" className="text-gray-800">Some experience</option>
            <option value="experienced" className="text-gray-800">Experienced owner</option>
            <option value="veteran" className="text-gray-800">Veteran (5+ years)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Budget Range</label>
          <select
            value={studioData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select budget range</option>
            <option value="under-10k" className="text-gray-800">Under $10,000</option>
            <option value="10k-25k" className="text-gray-800">$10,000 - $25,000</option>
            <option value="25k-50k" className="text-gray-800">$25,000 - $50,000</option>
            <option value="50k-100k" className="text-gray-800">$50,000 - $100,000</option>
            <option value="over-100k" className="text-gray-800">Over $100,000</option>
          </select>
        </div>
      </div>
      
      {/* Space and Goals */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Space Size</label>
        <input
          type="text"
          value={studioData.spaceSize}
          onChange={(e) => handleInputChange('spaceSize', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g., 1200 sq ft, 2 rooms, etc."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Primary Goals</label>
        <textarea
          value={studioData.goals}
          onChange={(e) => handleInputChange('goals', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="What do you want to achieve with your studio?"
          rows={3}
        />
      </div>
      
      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Specialties</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIALTY_OPTIONS.map(specialty => (
            <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={studioData.specialties.includes(specialty)}
                onChange={(e) => handleArrayChange('specialties', specialty, e.target.checked)}
                className="rounded border-white/20 text-blue-400 focus:ring-blue-400"
              />
              <span className="text-white text-sm">{specialty}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Equipment */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">Available Equipment</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EQUIPMENT_OPTIONS.map(equipment => (
            <label key={equipment} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={studioData.equipment.includes(equipment)}
                onChange={(e) => handleArrayChange('equipment', equipment, e.target.checked)}
                className="rounded border-white/20 text-blue-400 focus:ring-blue-400"
              />
              <span className="text-white text-sm">{equipment}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}