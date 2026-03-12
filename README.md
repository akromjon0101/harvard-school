# Harvard School — IELTS Mock Test Platform

A full-stack Computer-Based IELTS (CBT) practice platform with AI-powered writing and speaking evaluation.

## Features

- **Full CBT Exam Interface** — Listening, Reading, Writing, Speaking modules with official IELTS styling
- **AI Grading** — Writing tasks evaluated by GPT-4o with band scores across all four criteria (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)
- **Speaking AI Evaluation** — Per-part speaking assessment with transcription and feedback
- **Text Highlighting** — Students can highlight passages during Reading, Listening, and Writing tasks
- **Admin Panel** — Create and manage exams, grade submissions, manage users
- **Test Report Form** — Printable IELTS TRF-style result certificate
- **Secure Auth** — JWT-based authentication with role separation (student / admin)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7, Lucide React |
| Backend | Express.js, MongoDB Atlas, Mongoose |
| AI | OpenAI GPT-4o (writing vision), GPT-4o-mini (speaking) |
| Auth | JWT, bcryptjs |
| File Uploads | Multer |
| Styling | Pure CSS (no Tailwind) |

## Project Structure

```
├── src/                   # React frontend
│   ├── pages/             # Route-level page components
│   │   └── admin/         # Admin panel pages
│   ├── components/        # Reusable UI components
│   │   ├── exam/          # Question type renderers
│   │   └── admin/         # Admin-specific components
│   ├── services/          # API client, storage helpers
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # CSS files (scoped per feature)
│   └── data/              # Static question type guides
├── backend/               # Express.js API server
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── middleware/        # Auth middleware
│   ├── services/          # AI grader, transcriber, usage tracker
│   └── uploads/           # User-generated media (gitignored)
├── public/                # Static assets served by Vite
└── docs/                  # Development documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key (for AI grading features)

### Installation

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd mock
```

**2. Install frontend dependencies**

```bash
npm install
```

**3. Install backend dependencies**

```bash
cd backend
npm install
cd ..
```

**4. Configure environment variables**

```bash
# Frontend
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, ADMIN_PASSWORD
```

**5. Create uploads directory**

```bash
mkdir -p backend/uploads
```

### Running Locally

**Start the backend** (in one terminal):

```bash
cd backend
npm run dev
# Runs on http://localhost:5001
```

**Start the frontend** (in another terminal):

```bash
npm run dev
# Runs on http://localhost:5173
```

The admin account is created automatically on first backend startup using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

### Building for Production

```bash
npm run build
# Output in dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, etc.) and the backend to a Node.js host (Railway, Render, etc.).

## Admin Panel

Navigate to `/admin-login` and sign in with your admin credentials.

From the admin panel you can:
- **Create / edit exams** — full IELTS test builder with all question types
- **Review submissions** — grade writing and speaking responses, set band scores
- **Manage users** — view stats, block/unblock accounts, reset passwords
- **Monitor AI usage** — track OpenAI token consumption

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL, e.g. `http://localhost:5001/api` |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random 256-bit secret for signing tokens |
| `OPENAI_API_KEY` | OpenAI API key for AI grading |
| `ADMIN_EMAIL` | Initial admin account email |
| `ADMIN_PASSWORD` | Initial admin account password |
| `PORT` | Server port (default: 5001) |
| `FRONTEND_URL` | Frontend origin for CORS |

## Question Types Supported

- Multiple Choice (single & multi-answer)
- Gap Fill / Sentence Completion
- Matching / Matching Headings
- Table Completion
- Summary Completion (with phrase bank)
- Choose from Box
- Short Answer

## License

Private — all rights reserved.
