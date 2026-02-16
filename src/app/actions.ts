'use server'

import { prisma } from '@/lib/db'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/ratelimit'

// Schema for the input
const InputSchema = z.object({
    goal: z.string().min(5, "Goal must be at least 5 characters"),
    users: z.string().min(3, "Target audience must be specified"),
    constraints: z.string().optional(),
})

// Schema for the Strategy (Step 1)
const StrategySchema = z.object({
    analysis: z.string().describe("A brief analysis of the user's request, identifying complexity and key challenges."),
    architecture: z.string().describe("High-level architectural approach or design patterns recommended."),
    edgeCases: z.array(z.string()).describe("Potential edge cases or risks to consider."),
})

// Schema for the output (AI generation - Step 2)
const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.enum(['feature', 'bug', 'chore', 'story']),
    estimate: z.string().optional(),
})

const UserStorySchema = z.object({
    id: z.string(),
    asA: z.string(),
    iWant: z.string(),
    soThat: z.string(),
})

const SpecSchema = z.object({
    userStories: z.array(UserStorySchema),
    tasks: z.array(TaskSchema),
    riskAnalysis: z.string().optional(),
})

const geminiModelIds = ['gemini-flash-latest', 'gemini-2.0-flash']

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return String(error)
}

function isRecoverableGeminiError(error: unknown): boolean {
    const message = getErrorMessage(error).toLowerCase()
    return (
        message.includes('not found') ||
        message.includes('not supported') ||
        message.includes('listmodels') ||
        message.includes('unknown model') ||
        message.includes('quota exceeded')
    )
}

export async function generateSpecAction(prevState: any, formData: FormData) {
    const goal = formData.get('goal') as string
    const users = formData.get('users') as string
    const constraints = formData.get('constraints') as string || undefined
    console.log("DEBUG: Received Form Data", { goal, users, modelProvider: 'gemini' });

    // 1. Rate Limiting
    const limitParams = { interval: 60 * 1000, limit: 5 }; // 5 requests per minute
    const rateLimitResult = await rateLimit('global_demo_user', limitParams);

    if (!rateLimitResult.success) {
        return {
            message: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
            errors: { goal: ["Too many requests. Please wait."] }
        }
    }

    const validatedFields = InputSchema.safeParse({ goal, users, constraints })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to generate.',
        }
    }

    const { goal: vGoal, users: vUsers, constraints: vConstraints } = validatedFields.data

    // Mock Data Generator Helper
    const generateMockData = async (reason: string) => {
        console.log("Generating Mock Data fallback...", reason)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay

        const mockData = {
            userStories: [
                { id: 'us-1', asA: 'User', iWant: 'to see a demo', soThat: 'I can evaluate the app without a working API key' },
                { id: 'us-2', asA: 'Developer', iWant: 'fallback data', soThat: 'the app handles API errors gracefully' }
            ],
            tasks: [
                { id: 't-1', title: 'Check API Key', description: `Failed to use Gemini. Reason: ${reason}`, type: 'chore', estimate: '15m' },
                { id: 't-2', title: 'Verify Billing', description: 'Check your Gemini API billing/plan settings.', type: 'chore', estimate: '5m' }
            ],
            riskAnalysis: "This is a FALLBACK RESPONSE because the AI API call failed. Check your logs."
        }

        try {
            await prisma.generatedSpec.create({
                data: {
                    goal: vGoal,
                    users: vUsers,
                    constraints: vConstraints,
                    userStories: JSON.stringify(mockData.userStories),
                    tasks: JSON.stringify(mockData.tasks),
                    createdAt: new Date(),
                },
            })
            revalidatePath('/history')
        } catch (e) {
            console.error("Mock DB create error", e)
        }

        return { success: true, data: mockData, isMock: true, message: `Demo Mode: ${reason}`, strategy: undefined }
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return await generateMockData("Missing GOOGLE_GENERATIVE_AI_API_KEY")
    }

    const strategyPrompt = `
            Analyze this request:
            Goal: ${vGoal}
            Target Users: ${vUsers}
            Constraints: ${vConstraints || 'None'}
            
            Identify the core challenges, edge cases, and architectural patterns needed.
        `

    const taskPromptTemplate = (strategy: z.infer<typeof StrategySchema>) => `
            Based on the following strategy, generate detailed user stories and tasks.
            
            Strategy Analysis: ${strategy.analysis}
            Architecture: ${strategy.architecture}
            Edge Cases to Cover: ${strategy.edgeCases.join(', ')}
            
            Original Goal: ${vGoal}
            Users: ${vUsers}
            Constraints: ${vConstraints}
        `

    const candidateModels = geminiModelIds
    let lastError: unknown = undefined

    for (let i = 0; i < candidateModels.length; i++) {
        const candidateModelId = candidateModels[i]
        const model = google(candidateModelId)

        try {
            // --- Step 1: Strategist Agent ---
            const { object: strategy } = await generateObject({
                model: model,
                schema: StrategySchema,
                prompt: strategyPrompt,
            })

            console.log("Strategy Generated:", strategy)

            // --- Step 2: Generator Agent ---
            const { object: spec } = await generateObject({
                model: model,
                schema: SpecSchema,
                prompt: taskPromptTemplate(strategy),
            })

            try {
                await prisma.generatedSpec.create({
                    data: {
                        goal: vGoal,
                        users: vUsers,
                        constraints: vConstraints,
                        userStories: JSON.stringify(spec.userStories),
                        tasks: JSON.stringify(spec.tasks),
                        createdAt: new Date(),
                    },
                })
                revalidatePath('/history')
            } catch (dbError) {
                console.error("DB Error:", dbError)
            }

            const modelSwitchMessage = i > 0
                ? `Primary Gemini model unavailable; retried with ${candidateModelId}.`
                : undefined

            return {
                success: true,
                data: spec,
                strategy: strategy,
                message: modelSwitchMessage
            }
        } catch (error: unknown) {
            lastError = error
            const canRetryModel = i < candidateModels.length - 1 && isRecoverableGeminiError(error)
            if (canRetryModel) {
                console.warn(`Model ${candidateModelId} unavailable for Gemini. Retrying with next model.`)
                continue
            }
            break
        }
    }

    console.error("AI Error:", lastError)
    return await generateMockData(getErrorMessage(lastError) || "Unknown AI Error")
}

export async function getRecentSpecs() {
    try {
        const specs = await prisma.generatedSpec.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        })
        return specs
    } catch (error) {
        console.error("Failed to fetch specs", error)
        return []
    }
}
