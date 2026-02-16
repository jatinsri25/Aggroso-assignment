import { prisma } from '@/lib/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default async function StatusPage() {
    let dbStatus = 'Unknown'
    const geminiConfigured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

    // Check DB
    try {
        await prisma.$queryRaw`SELECT 1`
        dbStatus = 'Healthy'
    } catch (e) {
        console.error(e)
        dbStatus = 'Unhealthy'
    }

    return (
        <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="hero-gradient text-4xl font-bold">System Status</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Live checks for database, provider setup, and runtime health.</p>
                </div>
                <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200">
                    Back to Generator
                </Link>
            </div>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Database Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${dbStatus === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{dbStatus}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Checking connection to SQLite database.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">LLM Provider</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${geminiConfigured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span>{geminiConfigured ? 'Configured: gemini' : 'Missing GOOGLE_GENERATIVE_AI_API_KEY'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Verifying Gemini API key presence. (Actual connectivity check requires a request)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Backend Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            <span>Running</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Next.js App Router is active.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
