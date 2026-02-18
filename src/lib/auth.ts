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

type UserWithPassword = SafeUser & {
  passwordHash: string
}

type MemorySession = {
  userId: string
  expiresAt: Date
}

const memoryUsersById = new Map<string, UserWithPassword>()
const memoryUsersByEmail = new Map<string, UserWithPassword>()
const memorySessions = new Map<string, MemorySession>()
const allowMemoryFallback = process.env.NODE_ENV !== 'production'
const authStorageErrorMessage =
  'Authentication storage is not initialized. Apply Prisma schema to your database and retry.'

type PrismaAuthDelegate = {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<UserWithPassword | null>
    create: (args: { data: { email: string; name?: string; passwordHash: string } }) => Promise<UserWithPassword>
    findUniqueOrThrow: (args: { where: { id: string } }) => Promise<UserWithPassword>
  }
  session: {
    create: (args: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => Promise<unknown>
    deleteMany: (args: { where: { tokenHash: string } }) => Promise<unknown>
    findFirst: (args: {
      where: { tokenHash: string; expiresAt: { gt: Date } }
      select: { user: { select: { id: true; email: true; name: true } } }
    }) => Promise<{ user: SafeUser } | null>
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(10).toString('hex')}`
}

function getPrismaAuthDelegate(): PrismaAuthDelegate | null {
  const delegate = prisma as unknown as Partial<PrismaAuthDelegate>
  if (!delegate.user || !delegate.session) return null
  return delegate as PrismaAuthDelegate
}

function assertAuthStorageAvailable(): void {
  if (!allowMemoryFallback) {
    throw new Error(authStorageErrorMessage)
  }
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

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const delegate = getPrismaAuthDelegate()
  if (delegate) {
    try {
      return await delegate.user.findUnique({ where: { email } })
    } catch {
      assertAuthStorageAvailable()
    }
  } else {
    assertAuthStorageAvailable()
  }

  return memoryUsersByEmail.get(email) ?? null
}

export async function createUser(input: { email: string; name?: string; passwordHash: string }): Promise<UserWithPassword> {
  const delegate = getPrismaAuthDelegate()
  if (delegate) {
    try {
      return await delegate.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
        },
      })
    } catch {
      assertAuthStorageAvailable()
    }
  } else {
    assertAuthStorageAvailable()
  }

  const user: UserWithPassword = {
    id: randomId('usr'),
    email: input.email,
    name: input.name ?? null,
    passwordHash: input.passwordHash,
  }

  memoryUsersById.set(user.id, user)
  memoryUsersByEmail.set(user.email, user)
  return user
}

async function findUserById(id: string): Promise<SafeUser | null> {
  const delegate = getPrismaAuthDelegate()
  if (delegate) {
    try {
      const user = await delegate.user.findUniqueOrThrow({ where: { id } })
      return { id: user.id, email: user.email, name: user.name }
    } catch {
      assertAuthStorageAvailable()
    }
  } else {
    assertAuthStorageAvailable()
  }

  const user = memoryUsersById.get(id)
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name }
}

export async function createSessionForUser(userId: string): Promise<void> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const delegate = getPrismaAuthDelegate()
  if (delegate) {
    try {
      await delegate.session.create({
        data: {
          tokenHash,
          userId,
          expiresAt,
        },
      })
    } catch {
      assertAuthStorageAvailable()
      memorySessions.set(tokenHash, { userId, expiresAt })
    }
  } else {
    assertAuthStorageAvailable()
    memorySessions.set(tokenHash, { userId, expiresAt })
  }

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
    const tokenHash = sha256(rawToken)
    const delegate = getPrismaAuthDelegate()
    if (delegate) {
      try {
        await delegate.session.deleteMany({
          where: { tokenHash },
        })
      } catch {
        assertAuthStorageAvailable()
        // Ignore DB auth cleanup errors and rely on cookie deletion.
      }
    }
    memorySessions.delete(tokenHash)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) return null

  const tokenHash = sha256(rawToken)
  const delegate = getPrismaAuthDelegate()

  if (delegate) {
    try {
      const session = await delegate.session.findFirst({
        where: {
          tokenHash,
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

      if (session) return session.user
    } catch {
      assertAuthStorageAvailable()
    }
  } else {
    assertAuthStorageAvailable()
  }

  const fallbackSession = memorySessions.get(tokenHash)
  if (!fallbackSession || fallbackSession.expiresAt <= new Date()) {
    memorySessions.delete(tokenHash)
    return null
  }

  const fallbackUser = await findUserById(fallbackSession.userId)
  if (!fallbackUser) {
    memorySessions.delete(tokenHash)
    return null
  }

  return fallbackUser
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
