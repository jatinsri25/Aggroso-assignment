import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { signOutAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export async function AuthControls() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost">Login</Button>
        </Link>
        <Link href="/signup">
          <Button variant="outline">Sign up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-xs font-semibold text-muted-foreground sm:block">
        {user.name || user.email}
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">Logout</Button>
      </form>
    </div>
  )
}
