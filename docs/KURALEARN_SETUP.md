# KuraLearn Setup

KuraLearn is organized as three apps:

- `KuraLearn-bn`: Express, TypeScript, Prisma, PostgreSQL, JWT, OpenAI backend.
- `KuraLearn-fn`: Vite React web app with Tailwind, Redux Toolkit UI state, TanStack Query API caching, student navigation, and LearnGrow teacher navigation.
- `KuraLearn-app`: Expo React Native mobile app with role-based bottom tabs for learners and teachers.

## Environment

Backend variables live in `KuraLearn-bn/.env`.

```bash
DATABASE_URL="postgresql://postgres:123@localhost:5432/kuralearn"
JWT_SECRET="replace-with-a-long-random-secret-at-least-24-characters"
OPENAI_API_KEY=""
OPENAI_MODEL=gpt-5.5
OPENAI_FAST_MODEL=gpt-5.4-mini
APP_ENV=development
API_BASE_URL="http://localhost:4000/api/v1"
WEB_ORIGIN="http://localhost:5173"
MOBILE_ORIGIN="exp://localhost:8081"
```

The OpenAI key is used only by the backend. Web and mobile call `/api/v1/ai/*`.

## Database

```bash
cd KuraLearn-bn
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
```

Demo accounts:

- `student@kuralearn.demo` / `Demo1234`
- `parent@kuralearn.demo` / `Demo1234`
- `teacher@kuralearn.demo` / `Demo1234`
- `admin@kuralearn.demo` / `Demo1234`
- `teacher@learngrow.demo` / `Demo1234`
- `head@learngrow.demo` / `Demo1234`
- `admin@learngrow.demo` / `Demo1234`
- `super@learngrow.demo` / `Demo1234`

The LearnGrow seed includes Mrs. Mukamana, Primary 3A, Primary 4B, Primary 5A, Primary 6B, Mathematics/English/Science/Kinyarwanda assignments, a `Fractions - Equal Parts` lesson, a `Fractions Quick Quiz`, 30 learners, messages, reports, resources, interventions, notifications, and audit entries.

## Run Locally

Backend:

```bash
cd KuraLearn-bn
npm start
```

Web:

```bash
cd KuraLearn-fn
VITE_API_URL=http://localhost:4000/api/v1 npm run dev
```

The web teacher workspace is available after logging in as `teacher@learngrow.demo`. It uses `/teacher/*` REST endpoints, Redux Toolkit for drawers/modals/toasts, and TanStack Query for cached dashboard/list/detail data.

Mobile:

```bash
cd KuraLearn-app
npm run dev -- --localhost
```

The Expo teacher app switches bottom tabs by role: Dashboard, Classes, Lessons, Quizzes, and Reports, with Messages available from the dashboard.

## Verification

```bash
cd KuraLearn-bn && npm run build
cd KuraLearn-fn && npm run build
cd KuraLearn-app && npm run typecheck
```

## Deployment Notes

- Run `npm run prisma:migrate:deploy` before starting the backend.
- Set a strong `JWT_SECRET` in production.
- Set `OPENAI_API_KEY` only in backend runtime secrets.
- Point `VITE_API_URL` and Expo `extra.apiUrl` at the deployed backend.
- Add HTTPS, production CORS origins, request logging, and managed Postgres backups before public launch.
