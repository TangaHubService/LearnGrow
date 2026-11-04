# KuraLearn Backend

Express, TypeScript, Prisma, PostgreSQL, JWT auth, rate limiting, and backend-only OpenAI integration for KuraLearn learners and the LearnGrow teacher journey.

## First Run

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d` or your local Postgres.
3. Run `npm install`.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:migrate:deploy`.
6. Run `npm run db:seed`.
7. Run `npm start` or `npm run dev`.

Demo users:

- Student: `student@kuralearn.demo` / `Demo1234`
- Teacher: `teacher@learngrow.demo` / `Demo1234`
- Head teacher: `head@learngrow.demo` / `Demo1234`
- Admin: `admin@learngrow.demo` / `Demo1234`
- Super admin: `super@learngrow.demo` / `Demo1234`

See `../docs/API.md` and `../docs/KURALEARN_SETUP.md`.
