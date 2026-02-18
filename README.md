A web application that helps you plan software features by generating user stories and engineering tasks using AI.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjatinsri25%2FAggroso-assignment&env=GOOGLE_GENERATIVE_AI_API_KEY,DATABASE_URL,DIRECT_URL)

## How to Run

1.  **Clone the repository** (if not already local).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    - Copy `.env.example` to `.env`
    - Add your Gemini API Key to `GOOGLE_GENERATIVE_AI_API_KEY`
    - Ensure `DATABASE_URL` and `DIRECT_URL` are set for PostgreSQL
4.  **Initialize Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000)

## Docker Run (One Command)
If you prefer to run with Docker:

1.  Make sure you have `GOOGLE_GENERATIVE_AI_API_KEY` set in your `.env` or pass it inline.
2.  Run:
    ```bash
    docker-compose up --build
    ```
3.  Open [http://localhost:3000](http://localhost:3000)

## Features (Done)
- [x] **Feature Generation**: Input goal/users/constraints -> Get User Stories & Tasks.
- [x] **Task Editor**: Edit generate tasks, reorder them, grouping support (via types).
- [x] **Export**: Copy to clipboard or download as Markdown.
- [x] **History**: View last 5 generated specs.
- [x] **Status Page**: Check DB and LLM connectivity.
- [x] **Authentication**: Secure Login / Sign Up with session-based auth.
- [x] **Risk Analysis**: AI provides a brief risk assessment.
- [x] **Templates**: Quick-start templates for common app types.
- [x] **Mock Mode**: Fallback generation when API key is missing.
- [x] **Dark Mode**: Toggle between light and dark themes.

## Features (Not Done / Future Work)
- [ ] Drag and Drop reordering (currently using buttons).
- [ ] Persistent modifications (editing only affects local view until re-generated, save functionality for edits is not fully implemented in DB, only initial generation is saved).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI philosophy
- **AI**: Google Gemini API + Vercel AI SDK
- **Database**: Prisma + SQLite (dev) / PostgreSQL (prod ready)
