import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/client.js'
import { HttpError } from '../lib/httpError.js'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not found' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
    return
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // https://www.prisma.io/docs/orm/reference/error-reference
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Not found' })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'Already exists' })
      return
    }
    if (err.code === 'P2003') {
      res.status(409).json({ message: 'Still in use by other records' })
      return
    }
  }
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({ message: 'File is too large (max 5 MB)' })
    return
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'Invalid JSON' })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
}
