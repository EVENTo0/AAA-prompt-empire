import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'aaa_empire_session'
const SESSION_TTL_SECONDS = 60 * 60 * 12

function requiredSecret(name: 'CONTROL_PLANE_ACCESS_KEY' | 'CONTROL_PLANE_SESSION_SECRET') {
  const value = process.env[name]
  if (!value || value.length < 24) return null
  return value
}

function equalText(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function authConfigured() {
  return Boolean(requiredSecret('CONTROL_PLANE_ACCESS_KEY') && requiredSecret('CONTROL_PLANE_SESSION_SECRET'))
}

export function validateAccessKey(candidate: string) {
  const configured = requiredSecret('CONTROL_PLANE_ACCESS_KEY')
  return Boolean(configured && equalText(candidate, configured))
}

export function createSessionValue(now = Date.now()) {
  const secret = requiredSecret('CONTROL_PLANE_SESSION_SECRET')
  if (!secret) throw new Error('Session secret is not configured')
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS
  const payload = `v1.${expiresAt}`
  return `${payload}.${signature(payload, secret)}`
}

export function verifySessionValue(value: string | undefined, now = Date.now()) {
  const secret = requiredSecret('CONTROL_PLANE_SESSION_SECRET')
  if (!secret || !value) return false
  const [version, expiresRaw, supplied] = value.split('.')
  if (version !== 'v1' || !expiresRaw || !supplied) return false
  const expiresAt = Number(expiresRaw)
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false
  const payload = `${version}.${expiresRaw}`
  return equalText(supplied, signature(payload, secret))
}

export async function isAuthorized() {
  const store = await cookies()
  return verifySessionValue(store.get(COOKIE_NAME)?.value)
}

export const sessionCookie = {
  name: COOKIE_NAME,
  ttl: SESSION_TTL_SECONDS,
}
