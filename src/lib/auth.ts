import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

const SESSION_COOKIE_NAME = 'tg_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7
const PASSWORD_ITERATIONS = 120_000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

type SafeUser = {
  id: string
  email: string
  name: string | null
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [algorithm, iterationsRaw, salt, storedHash] = passwordHash.split('$')
  if (algorithm !== 'pbkdf2' || !iterationsRaw || !salt || !storedHash) return false

  const iterations = Number(iterationsRaw)
  if (!Number.isFinite(iterations) || iterations <= 0) return false

  const computed = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
  const stored = Buffer.from(storedHash, 'hex')

  if (computed.length !== stored.length) return false
  return timingSafeEqual(computed, stored)
}

export async function createSessionForUser(userId: string): Promise<void> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (rawToken) {
    await prisma.session.deleteMany({
      where: { tokenHash: sha256(rawToken) },
    })
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) return null

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: sha256(rawToken),
      expiresAt: { gt: new Date() },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME)
    return null
  }

  return session.user
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
