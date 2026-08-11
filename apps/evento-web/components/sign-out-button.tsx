'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      className="button secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await fetch('/api/account/logout', { method: 'POST' })
        } finally {
          router.replace(`/${locale}/account`)
          router.refresh()
        }
      }}
    >
      {label}
    </button>
  )
}
