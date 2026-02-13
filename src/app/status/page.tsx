import { prisma } from '@/lib/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from 'lucide-react'

// Note: Badge is not in lucide-react. I'll use a simple span or create a badge component later if needed.
// For now, simple text color is fine.

export default async function StatusPage() {
    let dbStatus = 'Unknown'
    let llmStatus = 'Unknown'

    // Check DB
    try {
        await prisma.$queryRaw`SELECT 1`
        dbStatus = 'Healthy'
    } catch (e) {
        console.error(e)
        dbStatus = 'Unhealthy'
    }

    // Check LLM
    if (process.env.OPENAI_API_KEY) {
        llmStatus = 'Configured (Ready)'
    } else {
        llmStatus = 'Missing API Key'
    }

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">System Status</h1>
            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Connection</CardTitle>
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
                        <CardTitle>LLM Connection (OpenAI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${llmStatus.includes('Ready') ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span>{llmStatus}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Verifying API Key presence. (Actual connectivity check requires a request)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Backend Health</CardTitle>
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
            <a href="/" className="block mt-8 text-center text-blue-500 hover:underline">Back to Generator</a>
        </div>
    )
}
