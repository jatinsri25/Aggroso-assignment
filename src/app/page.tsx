import GeneratorForm from "@/components/generator-form"
import { getRecentSpecs } from "@/app/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthControls } from "@/components/auth-controls"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const recentSpecs = await getRecentSpecs()

  return (
    <main className="relative min-h-screen text-foreground">
      <div className="app-grid pointer-events-none absolute inset-0 opacity-55" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="glow-chip mb-4 inline-flex rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-900 dark:text-cyan-100">
              Product Planning Studio
            </p>
            <h1 className="hero-gradient text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Tasks Generator
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Turn rough feature ideas into structured stories, tasks, and risk notes with an AI assistant tuned for engineering teams.
            </p>
          </div>

          <nav className="glow-card flex flex-wrap items-center gap-2 rounded-2xl p-2">
            <Link href="/history">
              <Button variant="ghost">History</Button>
            </Link>
            <Link href="/status">
              <Button variant="ghost">Status</Button>
            </Link>
            <AuthControls />
            <ThemeToggle />
          </nav>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GeneratorForm />
          </div>

          <aside className="hidden space-y-6 lg:block">
            <div className="glow-card rounded-2xl p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recent Generations
              </h3>
              <ul className="space-y-3">
                {recentSpecs.map((spec: any) => (
                  <li key={spec.id} className="panel-separator pb-3 last:border-0 last:pb-0">
                    <div className="truncate text-sm font-medium text-foreground">{spec.goal}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(spec.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
                {recentSpecs.length === 0 && (
                  <li className="text-sm text-muted-foreground">No recent specs found.</li>
                )}
              </ul>
              <Link href="/history" className="mt-5 inline-flex text-xs font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200">
                View All History
              </Link>
            </div>

            <div className="glow-card rounded-2xl p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tips</h3>
              <p className="text-sm text-muted-foreground">
                Include platform constraints, integrations, and non-functional requirements to get implementation-ready tasks.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
