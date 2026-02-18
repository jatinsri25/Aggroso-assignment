'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { AuthActionState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AuthFormProps = {
  mode: 'login' | 'signup'
  action: (prevState: AuthActionState, formData: FormData) => Promise<AuthActionState>
}

const initialState: AuthActionState = {}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const isLogin = mode === 'login'

  return (
    <Card className="mx-auto w-full max-w-md rounded-2xl">
      <CardHeader>
        <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
        <CardDescription>
          {isLogin
            ? 'Sign in to access your AI planning workspace.'
            : 'Sign up to save specs and access your dashboard securely.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/90" htmlFor="name">Name</label>
              <Input id="name" name="name" placeholder="Your name" autoComplete="name" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/90" htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/90" htmlFor="password">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {state?.error && (
            <p className="rounded-lg border border-red-300/40 bg-red-100/60 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200">
              {state.error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={pending}>
            {pending ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link
            href={isLogin ? '/signup' : '/login'}
            className="font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
