import GeneratorForm from "@/components/generator-form"
import { getRecentSpecs } from "@/app/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const recentSpecs = await getRecentSpecs()

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background text-foreground">
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Tasks Generator
        </h1>
        <nav className="flex gap-4">
          <Link href="/history">
            <Button variant="ghost">History</Button>
          </Link>
          <Link href="/status">
            <Button variant="ghost">Status</Button>
          </Link>
        </nav>
      </header>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GeneratorForm />
        </div>

        <aside className="hidden lg:block space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold mb-4">Recent Generations</h3>
            <ul className="space-y-3">
              {recentSpecs.map((spec: any) => (
                <li key={spec.id} className="text-sm border-b pb-2 last:border-0 pl-1">
                  <div className="font-medium truncate">{spec.goal}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(spec.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
              {recentSpecs.length === 0 && (
                <li className="text-sm text-muted-foreground">No recent specs found.</li>
              )}
            </ul>
            <Link href="/history" className="text-xs text-blue-500 hover:underline mt-4 block">
              View All History
            </Link>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold mb-2">Tips</h3>
            <p className="text-xs text-muted-foreground">
              Be specific with your goals. Mention the tech stack in constraints for better technical tasks.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
