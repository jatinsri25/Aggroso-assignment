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
    riskAnalysis: z.string().optional(), // "Make it your own" feature
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

    try {
        const prompt = `
      Goal: ${vGoal}
      Target Users: ${vUsers}
      Constraints: ${vConstraints || 'None'}

      Generate a list of user stories and engineering tasks for this feature. 
      Also provide a brief risk analysis.
    `

        // Start AI generation
        const { object } = await generateObject({
            model: openai('gpt-4-turbo'), // or gpt-3.5-turbo depends on key availability
            schema: SpecSchema,
            prompt: prompt,
        })

        // Save to DB
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
            // Continue returning result even if DB fails, but warn?
        }

        return {
            success: true,
            data: object,
        }

    } catch (error) {
        console.error("AI Error:", error)
        return {
            message: 'Failed to generate content. Please check API key/service status.',
        }
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
