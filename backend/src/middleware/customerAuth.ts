import type { NextFunction, Request, Response } from 'express'
import type { Prisma } from '../generated/prisma/client.js'
import { CUSTOMER_COOKIE, verifyCustomerToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

export const customerSelect = { id: true, email: true, name: true, phone: true, balance: true, createdAt: true } as const

declare module 'express-serve-static-core' {
  interface Request {
    customer?: Prisma.CustomerGetPayload<{ select: typeof customerSelect }>
  }
}

/** Sets req.customer when a valid website session cookie is present; never blocks. */
export async function loadCustomer(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[CUSTOMER_COOKIE]
  const session = typeof token === 'string' ? verifyCustomerToken(token) : null
  if (session) {
    const customer = await prisma.customer.findUnique({ where: { id: session.customerId }, select: customerSelect })
    if (customer) req.customer = customer
  }
  next()
}

/** 401 unless logged in on the website. Use after loadCustomer. */
export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (!req.customer) {
    res.status(401).json({ message: 'Please log in' })
    return
  }
  next()
}
