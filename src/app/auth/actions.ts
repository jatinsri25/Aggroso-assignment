'use server'

import { z } from 'zod'
import { clearSession, createSessionForUser, createUser, findUserByEmail, getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'

export type AuthActionState = {
  error?: string
}

const emailSchema = z.string().trim().email('Enter a valid email address')
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  name: z.string().trim().max(80, 'Name must be at most 80 characters').optional(),
  email: emailSchema,
  password: passwordSchema,
})

export async function signInAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const parsed = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' }
    }

    const user = await findUserByEmail(parsed.data.email.toLowerCase())

    if (!user) {
      return { error: 'No account found for this email. Please sign up first.' }
    }

    if (!verifyPassword(parsed.data.password, user.passwordHash)) {
      return { error: 'Incorrect password. Please try again.' }
    }

    await createSessionForUser(user.id)
    redirect('/')
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Login failed. Please try again.' }
  }
}

export async function signUpAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const parsed = signUpSchema.safeParse({
      name: formData.get('name')?.toString().trim() || undefined,
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid signup data' }
    }

    const email = parsed.data.email.toLowerCase()

    const existing = await findUserByEmail(email)
    if (existing) {
      return { error: 'An account with this email already exists' }
    }

    const user = await createUser({
      name: parsed.data.name,
      email,
      passwordHash: hashPassword(parsed.data.password),
    })

    await createSessionForUser(user.id)
    redirect('/')
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Signup failed. Please try again.' }
  }
}

export async function signOutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}

export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentUser()
  if (user) redirect('/')
}
