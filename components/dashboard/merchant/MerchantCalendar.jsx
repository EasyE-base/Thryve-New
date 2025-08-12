'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ThryveCalendar from '@/components/calendar/ThryveCalendar'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

// Adapter for merchant role
const merchantAdapter = {
  async fetchRange({ start, end }) {
    // Use server API that already authenticates and knows studioId
    const resp = await fetch(`/api/classes?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
      headers: { 'Accept': 'application/json' }
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.classes || []).map(c => ({
      id: c.id,
      name: c.name,
      startTime: c.startTime,
      endTime: c.endTime,
      instructorId: c.instructorId,
      type: c.type,
      studioId: c.studioId
    }))
  },
  canEdit(event, user) {
    // Merchants can edit all events from own studio; server will enforce
    return !!user
  },
  async onCreate({ start, end }) {
    const resp = await fetch('/api/classes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Class', startTime: start, endTime: end, capacity: 10 })
    })
    if (!resp.ok) throw new Error('create failed')
    return resp.json()
  },
  async onUpdate(event, changes) {
    const resp = await fetch(`/api/classes/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    })
    if (!resp.ok) throw new Error('update failed')
  }
}

export default function MerchantCalendar() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <ThryveCalendar role="merchant" adapter={merchantAdapter} />
        </CardContent>
      </Card>
    </div>
  )
}