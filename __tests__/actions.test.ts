
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSpecAction } from '../src/app/actions';
import { rateLimit } from '@/lib/ratelimit';

// Mock dependencies
vi.mock('@/lib/db', () => ({
    prisma: {
        generatedSpec: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
    rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60000 }),
}));

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: null }),
}));

// Mock AI SDK
vi.mock('ai', () => ({
    generateObject: vi.fn().mockResolvedValue({
        object: {
            analysis: "Test Analysis",
            architecture: "Test Architecture",
            edgeCases: ["Edge Case 1"],
            userStories: [],
            tasks: [],
        }
    }),
}));

describe('generateSpecAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
    });

    it('should validate input correctly', async () => {
        const formData = new FormData();
        // Missing fields

        const result = await generateSpecAction(null, formData);
        expect((result as any).errors).toBeDefined();
    });

    it('should succeed with valid input', async () => {
        const formData = new FormData();
        formData.append('goal', 'Build a todo app');
        formData.append('users', 'Everyone');
        formData.append('constraints', 'No constraints');
        formData.append('model', 'gemini');

        const result = await generateSpecAction(null, formData);

        // We expect success because we mocked generateObject
        // Note: Our mock returns the same object for both Step 1 and Step 2 calls for simplicity in this unit test,
        // which effectively simulates a successful run.
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
    });

    it('should fallback to mock if no API key', async () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = '';
        const formData = new FormData();
        formData.append('goal', 'Build a todo app');
        formData.append('users', 'Everyone');

        const result = await generateSpecAction(null, formData);
        expect((result as any).isMock).toBe(true);
        expect((result as any).message).toContain('Missing GOOGLE_GENERATIVE_AI_API_KEY');
    });

    it('should fail if rate limit exceeded', async () => {
        vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 1000 });
        const formData = new FormData();
        formData.append('goal', 'Test');

        const result = await generateSpecAction(null, formData);
        expect((result as any).message).toContain('Rate limit exceeded');
    });
});
