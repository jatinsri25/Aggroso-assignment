'use server'

import { prisma } from '@/lib/db'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Schema for the input
const InputSchema = z.object({
    goal: z.string().min(5, "Goal must be at least 5 characters"),
    users: z.string().min(3, "Target audience must be specified"),
    constraints: z.string().optional(),
})

// Schema for the output (AI generation)
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

export async function generateSpecAction(prevState: any, formData: FormData) {
    const goal = formData.get('goal') as string
    const users = formData.get('users') as string
    const constraints = formData.get('constraints') as string

    const validatedFields = InputSchema.safeParse({ goal, users, constraints })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to generate.',
        }
    }

    const { goal: vGoal, users: vUsers, constraints: vConstraints } = validatedFields.data

    // Mock Data Generator Helper
    const generateMockData = async () => {
        console.log("Generating Mock Data fallback...")
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay

        const mockData = {
            userStories: [
                { id: 'us-1', asA: 'User', iWant: 'to see a demo', soThat: 'I can evaluate the app without a working API key' },
                { id: 'us-2', asA: 'Developer', iWant: 'fallback data', soThat: 'the app handles API errors gracefully' }
            ],
            tasks: [
                { id: 't-1', title: 'Check OpenAI Key', description: 'The provided API Key might be invalid or out of credits.', type: 'chore', estimate: '15m' },
                { id: 't-2', title: 'Verify Billing', description: 'Check OpenAI platform billing settings.', type: 'chore', estimate: '5m' }
            ],
            riskAnalysis: "This is a FALLBACK RESPONSE because the OpenAI API call failed (Invalid Key or Quota Exceeded). Check your Vercel logs."
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

        return { success: true, data: mockData, isMock: true }
    }

    // Explicit Mock Mode if no key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "") {
        console.log("No OPENAI_API_KEY found. Using Mock Mode.")
        return await generateMockData()
    }

    try {
        const prompt = `
      Goal: ${vGoal}
      Target Users: ${vUsers}
      Constraints: ${vConstraints || 'None'}

      Generate a list of user stories and engineering tasks for this feature.
      Also provide a brief risk analysis.
    `

        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: SpecSchema,
            prompt: prompt,
        })

        try {
            await prisma.generatedSpec.create({
                data: {
                    goal: vGoal,
                    users: vUsers,
                    constraints: vConstraints,
                    userStories: JSON.stringify(object.userStories),
                    tasks: JSON.stringify(object.tasks),
                    createdAt: new Date(),
                },
            })
            revalidatePath('/history')
        } catch (dbError) {
            console.error("DB Error:", dbError)
        }

        return {
            success: true,
            data: object,
        }

    } catch (error) {
        console.error("AI Error (Falling back to mock):", error)
        // Fallback to mock data on ANY error
        return await generateMockData()
    }
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
