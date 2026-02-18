import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { redirectIfAuthenticated, signUpAction } from '@/app/auth/actions'

export default async function SignupPage() {
  await redirectIfAuthenticated()

  return (
    <main className="relative min-h-screen text-foreground">
      <div className="app-grid pointer-events-none absolute inset-0 opacity-55" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-10 md:px-8">
        <div className="grid w-full gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="glow-chip mb-4 inline-flex rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-900 dark:text-cyan-100">
              Join Workspace
            </p>
            <h1 className="hero-gradient text-4xl font-extrabold leading-tight">
              Create your account
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Sign up to generate and manage specs with authenticated access.
            </p>
            <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200">
              Back to Home
            </Link>
          </div>
          <AuthForm mode="signup" action={signUpAction} />
        </div>
      </div>
    </main>
  )
}
