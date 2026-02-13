# AI Notes

## What I Used AI For
- **Code Scaffolding**: Used AI (Command Line Agent) to initialize the Next.js project and setup configuration files.
- **Component Generation**: Used AI to generate the `GeneratorForm` logic and UI components structure, speeding up the implementation of complex React state.
- **Problem Solving**: Used AI to debug Prisma version issues (downgrading from v7 to v5).

## What I Checked Myself
- **Logic Verification**: I manually verified the `generateSpecAction` to ensure the prompt engineering was sound and the schema validation (Zod) was correct.
- **UI UX**: Checked the flow of the application to ensure it is intuitive (Input -> Generate -> Edit -> Export).
- **Security**: Ensured API keys are not exposed in client-side code (using Server Actions).

## LLM Provider
- **Provider**: OpenAI (GPT-4 / GPT-3.5-turbo)
- **Reason**: Access to structured output generation (`json_mode` or function calling via Vercel AI SDK) for reliable JSON responses which is crucial for this app. It is also the industry standard for reasoning tasks like "Project Planning".
