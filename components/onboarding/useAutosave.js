'use client'

import { useCallback, useEffect, useRef } from 'react'

export function useAutosave(callback, delayMs = 500) {
  const timerRef = useRef(null)
  const pendingRef = useRef(null)

  const queue = useCallback((payload) => {
    pendingRef.current = payload
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(async () => {
      const data = pendingRef.current
      pendingRef.current = null
      try {
        await callback(data)
        window.dataLayer?.push({ event: 'onboarding_autosave', ok: true, ...data })
      } catch (e) {
        window.dataLayer?.push({ event: 'onboarding_autosave', ok: false })
        // swallow to avoid UX disruptions
      }
    }, delayMs)
  }, [callback, delayMs])

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current) }, [])

  return queue
}


