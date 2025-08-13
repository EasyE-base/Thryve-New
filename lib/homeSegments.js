export const homeSegments = {
  studios: {
    hero: {
      headline: 'Launch and grow your studio. Bookings, payouts, analytics—done.',
      sub: 'Powerful tools to manage classes, payouts via Stripe, and growth analytics.',
      badges: ['5 Min Setup', 'Sync From Other Platforms', 'Payouts Daily'],
    },
    steps: [
      { title: 'Create your studio', desc: 'Start for free with email or Google.' },
      { title: 'Configure classes & pricing', desc: 'Add instructors, set capacity, sync calendars.' },
      { title: 'Launch & grow', desc: 'Go live, see bookings and payouts roll in automatically.' },
    ],
    benefits: [
      'Frustration‑free setup (5 min)',
      'Hiring & scheduling',
      'Secure payouts (Stripe)',
      'Real‑time analytics',
      'Role‑based access',
      'SOC2‑ready stack',
    ],
    features: [
      { t: 'Class Management', d: 'Schedule classes, manage capacity & instructors' },
      { t: 'Online Booking', d: 'Let clients book anytime' },
      { t: 'Payment Processing', d: 'Secure Stripe payouts' },
      { t: 'Instructor Hiring', d: 'Post jobs & manage applications' },
      { t: 'Marketing & Insights', d: 'Promotions & analytics' },
    ],
    pricing: {
      tiers: [
        { name: 'Starter', price: '$29/mo', features: ['Bookings & schedule','Stripe payouts','Basic analytics'], primary: false },
        { name: 'Business+', price: '$59/mo', features: ['Everything in Starter','Hiring & scheduling','Advanced analytics'], primary: true },
        { name: 'Enterprise', price: 'Custom', features: ['Custom SLAs','Dedicated support','Advanced controls'], primary: false },
      ],
      footnote: '+ 3.75% platform fee per customer transaction.',
      programs: [
        { title: 'Member Plus', desc: 'Cross-studio class packs, 5% per booking (only when redeemed).' },
        { title: 'Thryve X Pass', desc: 'Monthly credits across studios, 8% default (configurable 5–10%).' },
      ],
    },
  },
  instructors: {
    hero: {
      headline: 'Find work you love. Get hired by studios nearby.',
      sub: 'Browse open jobs, create a free profile, and get paid on time.',
      badges: ['Find Jobs Near You', 'Set Your Own Rates', 'Guaranteed Payouts'],
    },
    steps: [
      { title: 'Create your free profile', desc: 'No monthly fees.' },
      { title: 'Set your specialties & availability', desc: 'Define skills, rates, travel radius.' },
      { title: 'Start accepting gigs', desc: 'Get matched with studios and get paid via Stripe.' },
    ],
    benefits: [
      'No monthly fees',
      'Job discovery near you',
      'Set your rates & schedule',
      'Guaranteed payouts (7% fee capped at $12/session)',
      'Flexible visibility (opt in/out)',
      'Verified studios only',
    ],
    features: [
      { t: 'Profile & Portfolio', d: 'Showcase your skills, certs, and media' },
      { t: 'Job Discovery', d: 'View gigs by location & remote' },
      { t: 'Scheduling & Availability', d: 'Sync calendars & set travel radius' },
      { t: 'Payout Management', d: 'Guaranteed Stripe payments' },
      { t: 'Ratings & Reviews', d: 'Build your reputation' },
    ],
    pricing: {
      freeCard: {
        title: 'Free forever',
        bullets: [
          'No monthly fees',
          'Set your rates & availability',
          '7% marketplace fee, capped at $12/session',
        ],
        cta: { href: '/signup?role=instructor', label: 'Get started' },
      },
    },
  },
  members: {
    hero: {
      headline: 'Classes near you. Book in seconds.',
      sub: 'Discover studios, claim 10% off your first class, and join the ThryveX network.',
      badges: ['Discover Classes Nearby', 'Save With ThryveX', 'Book in One Tap'],
    },
    steps: [
      { title: 'Create a free account', desc: 'Enter your goals & preferences.' },
      { title: 'Find classes nearby', desc: 'Use our ZIP search or geolocation.' },
      { title: 'Book & save', desc: 'Redeem 10% off your first class and start earning credits.' },
    ],
    benefits: [
      'Thousands of classes near you',
      'Instant booking with saved payment',
      'Reward programs (X Pass credits)',
      'Trusted providers (background‑checked)',
      'Secure payments (Stripe)',
      'Community perks (reviews and ratings)',
    ],
    features: [
      { t: 'Class Discovery', d: 'Filter by type, location, price' },
      { t: 'Quick Booking', d: 'Save your card and book in one tap' },
      { t: 'Loyalty Rewards', d: 'Earn credits & discounts (X Pass)' },
      { t: 'Personalized Recommendations', d: 'Get tailored class suggestions' },
      { t: 'Secure Payments', d: 'Stripe processed' },
    ],
    pricing: {
      xpass: [
        { name: 'Lite', price: '$39/mo', credits: '4 credits' },
        { name: 'Core', price: '$79/mo', credits: '8 credits' },
        { name: 'Pro', price: '$119/mo', credits: '12 credits' },
      ],
      footnote: 'Rollover up to one month; cancel anytime; no‑show/late cancel forfeits credit.',
      alt: 'Or pay‑as‑you‑go — free to join, just pay class price.',
    },
  },
}


