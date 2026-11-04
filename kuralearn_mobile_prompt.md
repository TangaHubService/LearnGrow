# System Prompt & Specification Document for Building KuraLearn Mobile App

Copy and paste the entirety of this document into **Google AI Studio (Gemini 1.5 Pro or Gemini 2.0 Flash/Pro)** or your coding agent to initiate the building of the **KuraLearn Mobile App (`KuraLearn-app`)**.

---

## VISUAL LAYOUT & DESIGN REFERENCE (MOCKUPS)
Use these generated high-fidelity layout references as direct visual blueprints to match the aesthetic styles, roundness, layout structure, color schemes, and elements:

- **1. Student Dashboard (Gamified P1-P3 path with floating islands, badges, stars, streaks, and AI assistant button):**
  ![Student Dashboard Mockup](/Users/bertinniyonkuru/.gemini/antigravity/brain/6404ae86-fbcf-4ea1-aa3c-24190b2194de/kuralearn_student_dashboard_mockup_1779179408717.png)

- **2. AI Voice Tutor Chat Interface (Showing speech bubble streams, interactive choice questions, custom mic speaking feedback):**
  ![AI Tutor Chat Mockup](/Users/bertinniyonkuru/.gemini/antigravity/brain/6404ae86-fbcf-4ea1-aa3c-24190b2194de/kuralearn_ai_tutor_chat_mockup_1779179431008.png)

- **3. Interactive Story-driven Lesson Card (Fractions divided equally in a local Rwandan chapati sharing context, with progress tracker & read-aloud tools):**
  ![Interactive Lesson Mockup](/Users/bertinniyonkuru/.gemini/antigravity/brain/6404ae86-fbcf-4ea1-aa3c-24190b2194de/kuralearn_interactive_lesson_mockup_1779179458673.png)

- **4. Teacher Copilot & Student Risk Dashboard (Indigo & slate gray high-density panels, showing risk scores, recommendations, AI planning draft states):**
  ![Teacher Dashboard Mockup](/Users/bertinniyonkuru/.gemini/antigravity/brain/6404ae86-fbcf-4ea1-aa3c-24190b2194de/kuralearn_teacher_copilot_mockup_1779179489635.png)

---

## CONTEXT & IDENTITY
You are a **Staff Mobile Engineer (Expo React Native, TypeScript)** tasked with building the complete, production-ready, highly polished, and offline-first mobile app for **KuraLearn (LearnGrow AI)**. 

### What is KuraLearn?
KuraLearn is an AI-powered education ecosystem designed for Rwanda and other East African environments. It bridges the gap between classroom teaching and real-world competency.
- **Nursery & Lower Primary (LKG - P3)**: Focuses on literacy, numeracy, and pronunciation through animated, colorful, gamified, and audio-assisted lessons.
- **Upper Primary & Secondary (P4 - S6)**: Focuses on STEM learning, conceptual understanding, and real-world career-guided pathways.
- **Teachers**: Offers class management, attendance recording, lesson planning drafts, and quiz generation assisted by an AI copilot.
- **Parents**: Tracks child progress, attendance alerts, messaging with teachers, and receives AI parenting tips.

---

## 1. TECH STACK & CONFIGURATION

You MUST build the app using the following framework, strict tools, and configuration guidelines:
- **Core Framework**: Expo React Native (Managed Workflow), **TypeScript** (Strict mode).
- **Navigation**: **Expo Router** (using file-based routing: `(auth)`, `(student)`, `(teacher)`, `(parent)` groups).
- **Styling**: **NativeWind / TailwindCSS v4** (highly responsive, custom curated HSL color variables).
- **Animations**: **React Native Reanimated** or **Moti** for fluid transitions, and **Lottie-react-native** for lightweight child-friendly illustrations.
- **Local Storage / Caching**: **Expo SQLite** or **MMKV** for quick offline states, and **Expo SecureStore** for JWT tokens.
- **API & Network**: **TanStack Query (React Query) v5** with **Axios** (preconfigured with JWT interceptors, base URL, auto-retry, and offline mutations queue).

---

## 2. PROJECT ARCHITECTURE & FILE STRUCTURE

Initialize and implement the codebase following this strict directory layout:
```txt
KuraLearn-app/
├── app/                        # Expo Router entry points
│   ├── _layout.tsx             # Root layout with providers (QueryClient, Auth, Theme)
│   ├── index.tsx               # Entry router checking auth & redirecting by role
│   ├── (auth)/                 # Authentication Flow
│   │   ├── login.tsx           # Login screen
│   │   ├── register.tsx        # Registration screen
│   │   └── profile-setup.tsx   # Initial student profile configuration
│   ├── (student)/              # Student Workspace Tabs
│   │   ├── _layout.tsx         # Bottom tabs & Drawer for Student
│   │   ├── dashboard.tsx       # Gamified / Clean dashboard based on P-level
│   │   ├── subjects.tsx        # Subject & Course tree list
│   │   ├── lesson/[id].tsx     # Interactive offline-cached lesson viewer
│   │   ├── quiz/[id].tsx       # Interactive gamified Quiz screen
│   │   ├── ai-tutor.tsx        # AI chatbot with voice interaction (TTS/STT)
│   │   └── rewards.tsx         # Streak, coins, and badges collection
│   ├── (teacher)/              # Teacher Workspace Tabs
│   │   ├── _layout.tsx         # Bottom tabs for Teacher (Dashboard, Classes, Lessons, Quizzes, Reports)
│   │   ├── dashboard.tsx       # Live feed, quick action triggers, pending approvals
│   │   ├── classes.tsx         # School classes list & student search
│   │   ├── attendance.tsx      # High-density attendance grid (check-in list)
│   │   ├── ai-copilot.tsx      # AI lesson plan drafts & student risk alerts
│   │   └── messages.tsx        # Parent chat threads
│   └── (parent)/               # Parent Companion
│       ├── _layout.tsx         # Navigation drawer
│       ├── dashboard.tsx       # Child progress charts & attendance metrics
│       └── tips.tsx            # AI parenting guidance & notifications
├── src/
│   ├── components/             # Reusable UI Primitives
│   │   ├── ui/                 # Buttons, inputs, modals, text cards
│   │   ├── gamified/           # Stars, floating buttons, character speech bubbles
│   │   └── feedback/           # Loading, offline banners, empty lists
│   ├── hooks/                  # Custom react hooks
│   │   ├── useAuth.ts          # Centralized JWT authentication state
│   │   ├── useSync.ts          # Offline synchronizer background queue
│   │   └── useAudio.ts         # Speech synthesis and Kinyarwanda/English voice utilities
│   ├── services/               # API clients
│   │   ├── api.ts              # Axios instance configuration
│   │   ├── ai.ts               # AI tutoring and translation endpoints
│   │   └── offline.ts          # SQLite synchronization service
│   ├── theme/                  # Colors, fonts, layouts
│   └── types/                  # Strict Type declarations
```

---

## 3. CORE DESIGN SYSTEMS & PREMIUM UX

### A. Kid-Friendly Gamified Theme (LKG to P3 Students)
- **Palette**: Bright pastel tones. Harmonious combinations:
  - **Creamy Background**: `#FFFDF5`
  - **Energetic Yellow**: `#FFD33D` (streaks and coins)
  - **Playful Purple**: `#8A5CFF` (AI Tutor avatar)
  - **Mint Green**: `#4CD964` (correct answers)
  - **Soft Orange**: `#FF9500` (daily quests)
- **Geometry**: Soft shapes: `rounded-3xl` and `rounded-2xl`. Oversized buttons (`h-16`, padding `p-5`) with drop-shadows.
- **Audio Feedback**: Voice assist read-aloud buttons next to all headings. Simple click and celebration sounds (mocked locally).
- **Daily Streak Board**: Animated flames displaying numbers of active consecutive days.

### B. High-Density Analytics Theme (Teachers & Parents)
- **Palette**: Dark/Light mode supported clean minimalist grid.
  - **Primary**: Deep Indigo `#4F46E5`
  - **Secondary**: Slate `#64748B`
  - **Alert/Risk**: Emerald `#10B981` (High performance) / Rose `#EF4444` (At-risk warning)
- **Typography**: Sleek Sans-Serif font hierarchy (using Outfit or Inter).
- **Data Visualizations**: Clean card boards with stats, and visual graphs showing attendance and average scores.

---

## 4. OFFLINE-FIRST ARCHITECTURE (RURAL READY)

Since internet reliability is low in Rwandan rural schools:
1. **Pre-fetching Lessons**: Provide a "Download Lesson Pack" button for courses. This downloads lessons, quizzes, and asset references into SQLite local storage, and caches Lottie files/images to the filesystem using `expo-file-system`.
2. **Offline Mode Interceptor**: When offline, the app switches to the SQLite store (`src/services/offline.ts`). Students can read lessons, attempt quizzes, and unlock achievements.
3. **Queue Mutations Sync**: Quiz attempts and lesson progress done offline are appended to a SQLite `offline_sync_queue`. Once internet connectivity returns (using `@react-native-community/netinfo`), the queue automatically fires a batch upload to the `/api/v1/practice/attempts` and `/api/v1/lessons/:id/progress` endpoints.
4. **Offline Banner**: A subtle sliding green/amber header banner representing "Offline Mode - Progress is saved locally" or "Connected - Syncing progress..."

---

## 5. DETAILED FEATURE SPECIFICATIONS & PAGES

You must write functional React Native code for the following essential screens:

### 1. Student Dashboard (`(student)/dashboard.tsx`)
- Detects the child's academic grade level (e.g., LKG, P2 vs. P5, S1).
- **For P1-P3 (Gamified)**:
  - Large greeting card: "Hello [Name]! Ready to learn today?"
  - Star & Coin balance badge on top right with bounce micro-animations.
  - "Lesson Journey" path map displaying current subject courses as unlocked/locked islands.
  - AI Speech Tutor shortcut bubble: An animated floating robot prompting "Chat with me!"
- **For P4-S6 (Clean/STEM)**:
  - Direct progress panel tracking completed lessons.
  - Grid of current subjects (Mathematics, Science, English, Kinyarwanda).
  - Quick access card: "Solve Daily Real-World Application Challenge".

### 2. Interactive Offline Lesson Viewer (`(student)/lesson/[id].tsx`)
- High-quality, step-by-step slider card layout showing content chunks.
- Audio icon next to text fields that triggers Text-to-Speech (TTS) reading the text out loud in English or Kinyarwanda.
- "Try Practice Question" interactive drawer: Loads an multiple-choice question. If correct, shows a cute cartoon celebration Lottie animation and adds 10 coins. If wrong, calls the `/ai/hint` API or offline hints database.

### 3. AI tutor Chat (`(student)/ai-tutor.tsx`)
- Chat bubble stream with smooth slide-in animations.
- Mic input button utilizing Expo Speech-to-Text.
- Connects to `/api/v1/ai/chat` for tutoring replies.
- Must display `suggestedActions` (buttons that open lessons) and `practiceQuestion` parsed dynamically. If a practice question is returned in the API payload, it renders inside the chat flow as an interactive card.

### 4. Teacher AI-Copilot Dashboard (`(teacher)/ai-copilot.tsx`)
- Displays pending **AI Lesson Plans** that need approval before publishing to students.
- **At-Risk Alerts List**: Feeds from the `/ai/student-risk` endpoint showing students with falling attendance or low quiz scores. Includes details on their risk score and an **"AI Recommended Intervention"** button.
- Floating drawer that opens the AI draft dialog, letting teachers trigger `/ai/lesson-plan` or `/ai/parent-message-draft` and refine the generated drafts.

### 5. Attendance Recording Grid (`(teacher)/attendance.tsx`)
- Simple drop-down to select Class (e.g., "Primary 3A") and Date.
- Renders a fast scanning list of students with three toggle buttons: **Present (Green Check)**, **Late (Amber clock)**, and **Absent (Red cross)**.
- Button to save records, which stores offline if disconnected, and syncs as soon as the connection is established.

---

## 6. ENDPOINT INTEGRATION DICTIONARY

Use the following endpoints mapped to REST standard requests:

### Authentication:
- `POST /api/v1/auth/login` -> Body: `{ email, password }` -> Returns `{ accessToken, refreshToken, user: { id, role, studentProfile? } }`
- `GET /api/v1/students/me/dashboard` -> Returns current active subjects, streaks, total coins, and badges.

### Learning Content:
- `GET /api/v1/levels/:levelId/subjects` -> Fetches school level subjects.
- `GET /api/v1/lessons/:id` -> Returns full details of a lesson, questions, and audio links.
- `POST /api/v1/quizzes/:id/submit` -> Body: `{ answers: [{ questionId, selectedOption }] }` -> Returns `{ score, correctAnswers, xpAwarded, achievementsUnlocked: [] }`

### Messaging & AI:
- `POST /api/v1/ai/chat` -> Body: `{ message, history: [] }` -> Returns:
  ```json
  {
    "reply": "Excellent start! To find the fraction of a circle...",
    "suggestedActions": [
      { "label": "Review lesson on Fractions", "action": "OPEN_LESSON", "targetId": "fraction-lesson-1" }
    ],
    "practiceQuestion": {
      "questionText": "What is 1/2 of 8?",
      "options": ["2", "4", "6"],
      "hint": "Divide 8 into 2 equal groups."
    }
  }
  ```
- `POST /api/v1/teacher/delivery-sessions` -> Start live class delivery.

---

## 7. ROBUSTNESS & QUALITY CONTROLS
- **No placeholders**: Every screen must have authentic mock data if the API fails, ensuring a 100% working demo.
- **Strict Types**: Define explicit TS interfaces for all server responses: `Student`, `Lesson`, `Quiz`, `Message`, `RiskReport`, `Attendance`.
- **Error Boundaries**: Wrap major component regions in React Native ErrorBoundaries.
- **Graceful Loading states**: Use animated skeleton layouts for loaders, keeping the user interface extremely fast and interactive.

Start by setting up the Expo root router, writing helper hooks, and designing the core interactive screens!
