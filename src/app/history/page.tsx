import { getRecentSpecs } from '@/app/actions'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

type ParsedStory = {
    id: string
    asA: string
    iWant: string
}

type ParsedTask = {
    id: string
    title: string
    type: string
}

export default async function HistoryPage() {
    const specs = await getRecentSpecs()

    return (
        <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="hero-gradient text-4xl font-bold">Generation History</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Last 5 saved plans from your recent runs.</p>
                </div>
                <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200">
                    Back to Generator
                </Link>
            </div>

            <div className="space-y-6">
                {specs.map((spec: any) => (
                    <Card key={spec.id} className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl">{spec.goal}</CardTitle>
                            <CardDescription className="text-sm">
                                Target Users: {spec.users} | Created: {new Date(spec.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 text-sm text-muted-foreground"><strong>Constraints:</strong> {spec.constraints || 'None'}</div>
                            <details className="cursor-pointer">
                                <summary className="text-sm font-medium hover:underline">View User Stories ({JSON.parse(spec.userStories).length})</summary>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {JSON.parse(spec.userStories).map((s: ParsedStory) => (
                                        <li key={s.id}>As a {s.asA}, I want {s.iWant}...</li>
                                    ))}
                                </ul>
                            </details>
                            <details className="cursor-pointer mt-2">
                                <summary className="text-sm font-medium hover:underline">View Tasks ({JSON.parse(spec.tasks).length})</summary>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {JSON.parse(spec.tasks).map((t: ParsedTask) => (
                                        <li key={t.id}>{t.title} ({t.type})</li>
                                    ))}
                                </ul>
                            </details>
                        </CardContent>
                    </Card>
                ))}
                {specs.length === 0 && <p className="text-muted-foreground">No history found.</p>}
            </div>
        </div>
    )
}
