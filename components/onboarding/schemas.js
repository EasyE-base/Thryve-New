import { z } from 'zod'

const e164Phone = z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().or(z.literal('')).optional()
const urlOptional = z.string().url().optional().or(z.literal('')).optional()

// ---------- Merchant Schemas ----------
export const merchantProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  businessEmail: z.string().email(),
  phone: e164Phone,
  studioName: z.string().min(1),
  studioType: z.string().min(1),
})

export const merchantLocationSchema = z.object({
  address1: z.string().min(1),
  address2: z.string().optional().or(z.literal('')).optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
})

const businessHour = z.object({
  day: z.union([
    z.literal('Mon'), z.literal('Tue'), z.literal('Wed'), z.literal('Thu'), z.literal('Fri'), z.literal('Sat'), z.literal('Sun')
  ]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
}).refine(v => v.start < v.end, { message: 'Start must be before end', path: ['end'] })

export const merchantOperationsSchema = z.object({
  timeZone: z.string().min(1),
  businessHours: z.array(businessHour).min(1),
  classTypes: z.array(z.string()).optional().default([]),
  cancellationWindowHours: z.number().min(0).max(48).default(0),
  noShowFeeCents: z.number().min(0).max(20000).default(0),
  lateCancelFeeCents: z.number().min(0).max(20000).default(0),
})

export const merchantStaffSchema = z.object({
  invites: z.array(z.string().email()).optional().default([]),
})

export const merchantPricingSchema = z.object({
  plan: z.enum(['starter', 'business_plus', 'enterprise']),
})

export const merchantSetupSchema = z.object({
  brand: z.object({
    logoUrl: urlOptional,
    primaryColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().or(z.literal('')).optional(),
  }).optional().default({}),
  stripeConnected: z.boolean().optional().default(false),
})

// ---------- Instructor Schemas ----------
export const instructorProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: e164Phone,
  publicBio: z.string().max(280).min(1),
  specialties: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
})

export const instructorLocationSchema = z.object({
  homeZip: z.string().optional().or(z.literal('')).optional(),
  city: z.string().optional().or(z.literal('')).optional(),
  state: z.string().optional().or(z.literal('')).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  travelRadiusKm: z.number().min(0).max(100).default(0),
  remoteAvailable: z.boolean().default(false),
}).refine(v => !!v.homeZip || (!!v.city && !!v.state && typeof v.lat === 'number' && typeof v.lng === 'number'), {
  message: 'Provide homeZip or full city/state/lat/lng',
})

const availabilityWindow = z.object({
  day: z.union([
    z.literal('Mon'), z.literal('Tue'), z.literal('Wed'), z.literal('Thu'), z.literal('Fri'), z.literal('Sat'), z.literal('Sun')
  ]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
}).refine(v => v.start < v.end, { message: 'Start must be before end', path: ['end'] })

export const instructorAvailabilitySchema = z.object({
  windows: z.array(availabilityWindow).min(1),
  timeZone: z.string().min(1),
})

export const instructorRatesSchema = z.object({
  hourlyRate: z.number().min(10).max(500),
  minSessionLengthMins: z.enum(['30', '45', '60']).transform(v => parseInt(v, 10)),
})

export const instructorVisibilitySchema = z.object({
  marketplaceVisible: z.boolean().default(false),
})

export const instructorSetupSchema = z.object({
  avatarUrl: urlOptional,
  bannerUrl: urlOptional,
  stripeConnected: z.boolean().optional().default(false),
})


