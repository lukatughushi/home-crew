import type { NextFunction, Request, Response } from 'express'
import { ADMIN_COOKIE, verifyAdminToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

declare module 'express-serve-static-core' {
  interface Request {
    admin?: { id: number; email: string; name: string; title: string }
  }
}

/** Blocks the request with 401 unless it carries a valid admin session cookie. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[ADMIN_COOKIE]
  const session = typeof token === 'string' ? verifyAdminToken(token) : null
  if (!session) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Re-check the account still exists (a deleted admin's old cookie stops working).
  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, title: true },
  })
  if (!admin) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.admin = admin
  next()
}
