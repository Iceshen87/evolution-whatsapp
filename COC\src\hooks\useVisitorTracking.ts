import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'

const SESSION_ID_KEY = 'coc-session-id'

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

export function useVisitorTracking() {
  const location = useLocation()
  const startTime = useRef(Date.now())
  const sessionId = useRef(getSessionId())

  const track = (page: string, duration: number) => {
    axios.post('/site/visitors/track', {
      sessionId: sessionId.current,
      page,
      duration: Math.round(duration / 1000),
    }).catch(() => {})
  }

  // Track on page change
  useEffect(() => {
    const elapsed = Date.now() - startTime.current
    track(location.pathname, Math.round(elapsed / 1000))
  }, [location.pathname])

  // Heartbeat every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current
      track(location.pathname, Math.round(elapsed / 1000))
    }, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  // Track on page unload
  useEffect(() => {
    const handleUnload = () => {
      const elapsed = Date.now() - startTime.current
      const data = JSON.stringify({
        sessionId: sessionId.current,
        page: location.pathname,
        duration: Math.round(elapsed / 1000),
      })
      navigator.sendBeacon('/site/visitors/track', new Blob([data], { type: 'application/json' }))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [location.pathname])
}
