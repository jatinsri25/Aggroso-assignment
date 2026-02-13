# Prompts Used

## App Development Prompts

1. **Project Initialization**
   - "Create a Next.js app with TypeScript, Tailwind, and ESLint."
   - "Setup Prisma with SQLite."

2. **Feature Implementation**
   - "Create a form component in React that takes goal, users, and constraints."
   - "Implement a server action to call OpenAI API and return a JSON object with user stories and tasks."
   - "Add specific Zod schema for the output to ensure type safety."

3. **Debugging**
   - "Prisma error: datasource url not supported." -> "Downgrade Prisma to stable version."

## AI Feature Prompts (Inside the App)

The app uses the following system prompt for the AI Agent:

> "Goal: {goal}
> Target Users: {users}
> Constraints: {constraints}
> Generate a list of user stories and engineering tasks for this feature.
> Also provide a brief risk analysis."

This prompt is wrapped in `generateObject` from the Vercel AI SDK to enforce a specific JSON schema:
- `userStories`: Array of { asA, iWant, soThat }
- `tasks`: Array of { title, description, type, estimate }
- `riskAnalysis`: String
