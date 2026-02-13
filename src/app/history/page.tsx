import { getRecentSpecs } from '@/app/actions'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

export default async function HistoryPage() {
    const specs = await getRecentSpecs()

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">History</h1>
                <Link href="/" className="text-blue-500 hover:underline">Back to Generator</Link>
            </div>

            <div className="space-y-6">
                {specs.map((spec: any) => (
                    <Card key={spec.id}>
                        <CardHeader>
                            <CardTitle>{spec.goal}</CardTitle>
                            <CardDescription>
                                Target Users: {spec.users} | Created: {new Date(spec.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-2"><strong>Constraints:</strong> {spec.constraints || 'None'}</div>
                            <details className="cursor-pointer">
                                <summary className="text-sm font-medium hover:underline">View User Stories ({JSON.parse(spec.userStories).length})</summary>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {JSON.parse(spec.userStories).map((s: any) => (
                                        <li key={s.id}>As a {s.asA}, I want {s.iWant}...</li>
                                    ))}
                                </ul>
                            </details>
                            <details className="cursor-pointer mt-2">
                                <summary className="text-sm font-medium hover:underline">View Tasks ({JSON.parse(spec.tasks).length})</summary>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    {JSON.parse(spec.tasks).map((t: any) => (
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
