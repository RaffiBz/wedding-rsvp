import { useEffect, useRef } from 'react'

// Cloudflare Turnstile. The widget's mode (managed/invisible) is configured on
// the Cloudflare dashboard for the site key; the client just renders it.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileOptions) => string
      remove: (id: string) => void
      reset: (id?: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

interface TurnstileProps {
  siteKey: string
  /** Fired with a fresh token once the challenge passes. */
  onVerify: (token: string) => void
  /** Fired when the token expires or the challenge errors — clear it. */
  onExpire: () => void
}

export default function Turnstile({ siteKey, onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep latest callbacks without re-rendering the widget.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire

  useEffect(() => {
    let cancelled = false
    let widgetId: string | null = null

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => onVerifyRef.current(token),
          'expired-callback': () => onExpireRef.current(),
          'error-callback': () => onExpireRef.current(),
          'timeout-callback': () => onExpireRef.current(),
        })
      })
      .catch(() => {
        /* network/load failure — submit will prompt the user to retry */
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId)
        } catch {
          /* already removed */
        }
      }
    }
  }, [siteKey])

  return <div className="turnstile" ref={containerRef} />
}
