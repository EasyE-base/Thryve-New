'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import luxon3Plugin from '@fullcalendar/luxon3'
import { DateTime } from 'luxon'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

// Adapter interface: { fetchRange({start,end}), canEdit(event, user), onCreate({start,end}), onUpdate(event, changes) }
export default function ThryveCalendar({ role, adapter, timezone, colorStrategy = 'instructor' }) {
  const { user } = useAuth()
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const tz = timezone || DateTime.local().zoneName

  const initialView = useMemo(() => {
    if (role === 'customer') return 'listWeek'
    return 'timeGridWeek'
  }, [role])

  const loadEvents = async (start, end) => {
    if (!adapter?.fetchRange) return
    try {
      setLoading(true)
      const items = await adapter.fetchRange({ start, end })
      setEvents(items.map(mapToFullCalendarEvent))
    } catch (e) {
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const mapToFullCalendarEvent = (cls) => {
    const baseColor = colorStrategy === 'instructor'
      ? colorFromId(cls.instructorId || 'unassigned')
      : colorFromId(cls.type || 'default')
    return {
      id: cls.id,
      title: cls.name || 'Class',
      start: cls.startTime,
      end: cls.endTime,
      extendedProps: cls,
      backgroundColor: baseColor.bg,
      borderColor: baseColor.border,
      textColor: baseColor.text,
      editable: adapter?.canEdit ? adapter.canEdit(cls, user) : role !== 'customer'
    }
  }

  const colorFromId = (key) => {
    const palette = [
      ['#E3F2FD', '#90CAF9', '#0D47A1'],
      ['#E8F5E9', '#A5D6A7', '#1B5E20'],
      ['#FFF3E0', '#FFCC80', '#E65100'],
      ['#F3E5F5', '#CE93D8', '#4A148C'],
      ['#FBE9E7', '#FFAB91', '#BF360C']
    ]
    const i = Math.abs(hashCode(String(key))) % palette.length
    const [bg, border, text] = palette[i]
    return { bg, border, text }
  }

  const hashCode = (s) => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    }
    return h
  }

  const handleDatesSet = (arg) => {
    // arg: { start, end, startStr, endStr, view }
    loadEvents(arg.startStr, arg.endStr)
  }

  const handleDateClick = async (info) => {
    if (!adapter?.onCreate) return
    try {
      await adapter.onCreate({ start: info.dateStr, end: DateTime.fromISO(info.dateStr).plus({ minutes: 60 }).toISO() })
      // reload current range
      const api = calendarRef.current?.getApi()
      if (api) loadEvents(api.view.activeStart.toISOString(), api.view.activeEnd.toISOString())
    } catch (e) {
      toast.error('Failed to create class')
    }
  }

  const handleEventDrop = async (info) => {
    if (!adapter?.onUpdate) return
    try {
      await adapter.onUpdate(info.event.extendedProps, { startTime: info.event.start.toISOString(), endTime: info.event.end?.toISOString() })
    } catch (e) {
      info.revert()
      toast.error('Move not allowed')
    }
  }

  const handleEventResize = async (info) => {
    if (!adapter?.onUpdate) return
    try {
      await adapter.onUpdate(info.event.extendedProps, { endTime: info.event.end?.toISOString() })
    } catch (e) {
      info.revert()
      toast.error('Resize not allowed')
    }
  }

  return (
    <div className="rounded-lg border">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin, luxon3Plugin]}
        initialView={initialView}
        timeZone={tz}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
        weekends={true}
        nowIndicator={true}
        editable={role !== 'customer'}
        selectable={role === 'merchant'}
        selectMirror={true}
        dayMaxEvents={true}
        eventOverlap={true}
        events={events}
        datesSet={handleDatesSet}
        dateClick={role === 'merchant' ? handleDateClick : undefined}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        height="auto"
      />
    </div>
  )
}


