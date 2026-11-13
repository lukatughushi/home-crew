import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { ADMIN_COOKIE, adminCookieOptions, signAdminToken } from '../../lib/auth.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { resetLoginAttempts } from '../../middleware/loginLimiter.js'
import { loginInput } from '../../models/schemas.js'

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are admins.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

export async function login(req: Request, res: Response) {
  const { email, password } = loginInput.parse(req.body)
  const admin = await prisma.admin.findUnique({ where: { email } })
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH)
  if (!admin || !ok) throw new HttpError(401, 'Wrong email or password')

  resetLoginAttempts(req)
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
  res.cookie(ADMIN_COOKIE, signAdminToken(admin.id), adminCookieOptions)
  res.json({ id: admin.id, email: admin.email, name: admin.name, title: admin.title })
}

export function logout(_req: Request, res: Response) {
  const { maxAge: _maxAge, ...opts } = adminCookieOptions
  res.clearCookie(ADMIN_COOKIE, opts)
  res.status(204).end()
}

export function me(req: Request, res: Response) {
  res.json(req.admin)
}
