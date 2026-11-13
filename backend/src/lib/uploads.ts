// Image uploads from the admin panel, stored on disk in backend/uploads and served at /uploads/<file>.
// On a real host this folder must live on a persistent disk (or be swapped for S3/Cloudinary).
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError } from './httpError.js'

/** backend/uploads — the same folder whether running from src/ (dev) or dist/ (build). */
export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads/', import.meta.url))
export const UPLOAD_URL_PREFIX = '/uploads/'
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Real file type from the first bytes — never trust the Content-Type header alone. */
function detectExtension(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

/** Saves the raw request body as an image and returns its public URL, e.g. "/uploads/3f2c….jpg". */
export async function saveImage(body: unknown): Promise<string> {
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw new HttpError(400, 'Send the image as the request body (JPG, PNG or WebP)')
  }
  const ext = detectExtension(body)
  if (!ext) throw new HttpError(415, 'Only JPG, PNG or WebP images are allowed')

  await mkdir(UPLOAD_DIR, { recursive: true })
  const name = `${randomUUID()}.${ext}`
  await writeFile(path.join(UPLOAD_DIR, name), body)
  return UPLOAD_URL_PREFIX + name
}

/** Deletes a previously uploaded file. Ignores empty values, other URLs and already-missing files. */
export async function removeImage(url: string | null | undefined) {
  if (!url?.startsWith(UPLOAD_URL_PREFIX)) return
  const name = path.basename(url) // never follow "../" in a stored value
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {})
}
