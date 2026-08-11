'use client'

import { useEffect, useState } from 'react'

/**
 * The `beforeinstallprompt` event is Chromium-only and is not in the DOM lib.
 */
type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Copy = {
  title: string
  body: string
  install: string
  dismiss: string
  iosTitle: string
  iosBody: string
}

const DISMISSED_KEY = 'evento_install_dismissed'

export default function InstallPrompt({ copy }: { copy: Copy }) {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return

    // Already running as an installed app — never advertise installing again.
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone) return

    function capture(nativeEvent: Event) {
      // Suppress the browser's own mini-infobar so the offer appears in the
      // page, in the visitor's language, instead of a generic English chip.
      nativeEvent.preventDefault()
      setEvent(nativeEvent as InstallEvent)
    }

    window.addEventListener('beforeinstallprompt', capture)

    // iOS Safari never fires that event, so installation has to be explained
    // rather than triggered.
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      setShowIosHint(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setEvent(null)
    setShowIosHint(false)
  }

  async function install() {
    if (!event) return
    await event.prompt()
    await event.userChoice
    // The event can only be used once, whatever the visitor chose.
    setEvent(null)
  }

  if (!event && !showIosHint) return null

  return (
    <aside className="installBanner" role="complementary" aria-label={copy.title}>
      <div className="installText">
        <strong>{event ? copy.title : copy.iosTitle}</strong>
        <p>{event ? copy.body : copy.iosBody}</p>
      </div>
      <div className="installActions">
        {event ? (
          <button type="button" className="button primary" onClick={install}>
            {copy.install}
          </button>
        ) : null}
        <button type="button" className="button secondary" onClick={dismiss}>
          {copy.dismiss}
        </button>
      </div>
    </aside>
  )
}
