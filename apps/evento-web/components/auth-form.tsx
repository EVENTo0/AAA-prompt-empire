'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { translator } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

type Mode = 'signin' | 'signup'

export default function AuthForm({ locale }: { locale: Locale }) {
  const t = translator(locale)
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    setBusy(true)
    setError('')
    setConfirmSent(false)

    try {
      const response = await fetch(`/api/account/${mode === 'signin' ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as { ok?: boolean; needsConfirmation?: boolean; error?: string }

      if (!response.ok) {
        setError(messageFor(result.error, locale) ?? t('common.error'))
        return
      }
      if (result.needsConfirmation) {
        setConfirmSent(true)
        setMode('signin')
        return
      }

      router.replace(`/${locale}/account`)
      router.refresh()
    } catch {
      setError(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="formCard" onSubmit={submit} noValidate>
      <h1>{mode === 'signin' ? t('account.signIn') : t('account.signUp')}</h1>
      <p className="lead" style={{ marginBlockEnd: '1.25rem' }}>
        {t('account.lead')}
      </p>

      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      {confirmSent ? (
        <p className="notice success" role="status">
          {t('account.checkEmail')}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="email">{t('contact.email')}</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required dir="ltr" />
      </div>

      <div className="field">
        <label htmlFor="password">{t('account.password')}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          minLength={12}
          dir="ltr"
        />
        <span className="hint">{t('account.passwordHint')}</span>
      </div>

      <button type="submit" className="button primary" disabled={busy}>
        {busy ? t('contact.submitting') : mode === 'signin' ? t('account.signIn') : t('account.signUp')}
      </button>

      <p style={{ marginBlockStart: '1rem', marginBlockEnd: 0 }}>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
          }}
        >
          {mode === 'signin' ? t('account.needAccount') : t('account.haveAccount')}
        </button>
      </p>
    </form>
  )
}

function messageFor(code: string | undefined, locale: Locale): string | null {
  if (!code) return null
  const table: Record<string, Record<Locale, string>> = {
    'invalid-credentials': {
      ar: 'البريد أو كلمة المرور غير صحيحة.',
      en: 'Email or password is incorrect.',
    },
    'weak-password': {
      ar: 'كلمة المرور يجب أن تكون ١٢ حرفاً على الأقل.',
      en: 'Password must be at least 12 characters.',
    },
    'invalid-email': { ar: 'البريد الإلكتروني غير صالح.', en: 'Email address is not valid.' },
    'rate-limited': {
      ar: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
      en: 'Too many attempts. Wait a moment and try again.',
    },
    'not-configured': {
      ar: 'خدمة الحسابات غير مفعّلة في هذه النسخة.',
      en: 'The accounts service is not enabled on this deployment.',
    },
    timeout: { ar: 'انتهت مهلة الاتصال. أعد المحاولة.', en: 'The connection timed out. Try again.' },
  }
  return table[code]?.[locale] ?? null
}
