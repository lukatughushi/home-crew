import type { NextFunction, Request, Response } from 'express'

// Simple in-memory brute-force guard for the admin login.
// Fine for a single server; use a shared store (e.g. Redis) if you run several instances.
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; resetAt: number }>()

export function loginLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? 'unknown'
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }
  if (entry.count >= MAX_ATTEMPTS) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    res.status(429).json({ message: 'Too many login attempts, try again later' })
    return
  }
  entry.count++
  next()
}

/** Call after a successful login so the user isn't locked out by earlier typos. */
export function resetLoginAttempts(req: Request) {
  attempts.delete(req.ip ?? 'unknown')
}
