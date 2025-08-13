'use client'

const CITIES = [
  { name: 'New York City', city: 'New York', state: 'NY', zip: '10001' },
  { name: 'Los Angeles', city: 'Los Angeles', state: 'CA', zip: '90001' },
  { name: 'Chicago', city: 'Chicago', state: 'IL', zip: '60601' },
  { name: 'Miami', city: 'Miami', state: 'FL', zip: '33101' },
  { name: 'Austin', city: 'Austin', state: 'TX', zip: '73301' },
  { name: 'San Francisco', city: 'San Francisco', state: 'CA', zip: '94105' },
  { name: 'Seattle', city: 'Seattle', state: 'WA', zip: '98101' },
  { name: 'Boston', city: 'Boston', state: 'MA', zip: '02108' },
  { name: 'Atlanta', city: 'Atlanta', state: 'GA', zip: '30301' },
  { name: 'Dallas', city: 'Dallas', state: 'TX', zip: '75201' },
]

export default function PopularCities({ onSelect }) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {CITIES.map((c) => (
        <button
          key={c.zip}
          onClick={() => onSelect?.(c)}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-white/90 hover:bg-white/10 backdrop-blur"
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}


