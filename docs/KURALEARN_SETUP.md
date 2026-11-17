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

## Rwanda features

### Grading
New schools start on the Rwanda (NESA) preset: A–F plus S, grade points 6 (A) to 0 (F), pass mark 50%.
Bands are 80/70/60/50/40/30. School reviewers can change bands in Teacher Settings, and
"Use Rwanda (NESA) preset" puts them back. Confirm the bands against the current NESA guidance.

### Syllabus (REB competence-based curriculum)
Each subject can hold national syllabus units: key unit competence, content, generic competences
and cross-cutting issues (the REB lists, enforced by the API). Lesson plans, lessons and assessments
can link to a unit, and teachers see coverage under **Syllabus**.

The seed loads SAMPLE units for demos (labelled "Sample syllabus" in the app). Load the official
units as a super admin; units are matched by subject and unit number, so re-importing updates them:

```bash
curl -X POST "$API/syllabus/import" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
  "source": "REB",
  "subjects": [{ "level": "P3", "subject": "Mathematics", "units": [{
    "number": 1, "title": "Whole numbers up to 1,000",
    "keyUnitCompetence": "Read, write, compare and order whole numbers up to 1,000.",
    "content": ["Place value"], "genericCompetences": ["Critical thinking and problem solving"],
    "crossCuttingIssues": ["Inclusive education"], "term": 1, "suggestedPeriods": 12 }] }]
}'
```

### Languages
The web app runs in English, Kinyarwanda and French (switcher in the header, on the login page and
in Settings). Translations live in `KuraLearn-fn/src/i18n/messages/{rw,fr}.ts`, keyed by the English
text. Wrap new UI text in `t("…")`; `npm test` fails if a wrapped string has no Kinyarwanda or French
translation. The Kinyarwanda text is a draft: have a native speaker review it before release.

### Offline
In a production build, pages a user has opened keep working without a connection. Attendance, marks
and other plain changes made offline are kept on the device and sent, as the same user, when the
connection returns (sign-in, AI and file uploads need a connection). Logging out clears the saved
data so the next person on a shared device never sees it.

### SMS
Parents who chose SMS get a text when their child is marked absent or late (once per change), in
Kinyarwanda by default. Without a provider, texts are printed to the API log. To send real texts with
Africa's Talking, set in `KuraLearn-bn/.env`:

```bash
SMS_PROVIDER=africastalking
AFRICASTALKING_USERNAME=sandbox   # your app username in production
AFRICASTALKING_API_KEY=...
AFRICASTALKING_SENDER_ID=         # optional, once approved
SMS_LANGUAGE=rw                   # rw, en or fr
```

## Tests

```bash
cd KuraLearn-bn && npm test            # API, needs the database
cd KuraLearn-fn && npm test            # web unit tests and translation coverage
cd KuraLearn-fn && API_URL=http://localhost:4000/api/v1 npx playwright test e2e/login.spec.ts e2e/all-pages.spec.ts
```

`e2e/all-pages.spec.ts` opens every sidebar page for each role on desktop and phone widths and fails on
crashes or server errors. `e2e/offline.spec.ts` needs a production build served with `npm run preview`
(set `BASE_URL`).

## Deployment Notes

- Run `npm run prisma:migrate:deploy` before starting the backend.
- Set a strong `JWT_SECRET` in production.
- Set `OPENAI_API_KEY` only in backend runtime secrets.
- Point `VITE_API_URL` and Expo `extra.apiUrl` at the deployed backend.
- Add HTTPS, production CORS origins, request logging, and managed Postgres backups before public launch.
