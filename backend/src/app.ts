import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { UPLOAD_DIR } from './lib/uploads.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import routes from './routes/index.js'

const app = express()

app.disable('x-powered-by')
// Behind Render's proxy: use the real client IP (login rate limit) and protocol.
if (env.isProd) app.set('trust proxy', 1)
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.use('/api', routes)
// Uploaded images. File names are random UUIDs, so browsers may cache them forever.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    immutable: true,
    maxAge: '365d',
    index: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
)

// Website (React build) on the same origin, so login cookies just work.
if (env.serveFrontend) {
  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url))
  if (!existsSync(path.join(dist, 'index.html'))) throw new Error(`SERVE_FRONTEND=true but ${dist}index.html is missing — build the frontend first`)
  // Hashed asset files never change; index.html must always be re-checked.
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '365d', index: false }))
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  // Any other GET that isn't the API is a page of the single-page app.
  app.get(/^(?!\/(api|uploads)\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
