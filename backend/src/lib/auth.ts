import type { CookieOptions } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const ADMIN_COOKIE = 'hc_admin'
const SESSION_HOURS = 12

export interface AdminSession {
  adminId: number
}

export function signAdminToken(adminId: number): string {
  return jwt.sign({ adminId } satisfies AdminSession, env.jwtSecret, { expiresIn: `${SESSION_HOURS}h` })
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (typeof payload === 'object' && typeof payload.adminId === 'number') {
      return { adminId: payload.adminId }
    }
    return null
  } catch {
    return null
  }
}

/** httpOnly so page scripts can't read it; sameSite=strict blocks cross-site form posts. */
export const adminCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  path: '/api',
  maxAge: SESSION_HOURS * 60 * 60 * 1000,
}

// ─── Website customers ────────────────────────────────────────────
// Separate cookie and token shape: an admin token is never accepted as a customer one, and vice versa.

export const CUSTOMER_COOKIE = 'hc_session'
const CUSTOMER_SESSION_DAYS = 30

export function signCustomerToken(customerId: number): string {
  return jwt.sign({ customerId }, env.jwtSecret, { expiresIn: `${CUSTOMER_SESSION_DAYS}d` })
}

export function verifyCustomerToken(token: string): { customerId: number } | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    if (typeof payload === 'object' && typeof payload.customerId === 'number') {
      return { customerId: payload.customerId }
    }
    return null
  } catch {
    return null
  }
}

export const customerCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax', // lax so following a link to the site from elsewhere keeps you logged in
  path: '/api',
  maxAge: CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000,
}
