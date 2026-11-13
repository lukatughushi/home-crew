import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value || value === 'REPLACE_ME') {
    throw new Error(`Missing ${name} in backend/.env (see .env.example)`)
  }
  return value
}

const nodeEnv = process.env.NODE_ENV ?? 'development'

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv,
  isProd: nodeEnv === 'production',
  // Render sets RENDER_EXTERNAL_URL (e.g. https://homecrew.onrender.com) automatically.
  clientUrl: process.env.CLIENT_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000',
  /** Test wallet ("+500 ₾" button). On by default in development; set TEST_WALLET=true to allow it in production. */
  testWallet: process.env.TEST_WALLET ? process.env.TEST_WALLET === 'true' : nodeEnv !== 'production',
  /** Serve the built website (frontend/dist) from this server — one service, one origin (used on Render). */
  serveFrontend: process.env.SERVE_FRONTEND === 'true',
  databaseUrl: required('DATABASE_URL'),
  /** Max DB connections; set to 1 for the single-connection `prisma dev` database. */
  databasePoolMax: process.env.DATABASE_POOL_MAX ? Number(process.env.DATABASE_POOL_MAX) : undefined,
  jwtSecret: required('JWT_SECRET'),
}
