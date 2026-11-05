# BloomNotes

A polished, full-stack personal notes, knowledge management, journaling and private digital space application with a distinctive floral visual identity.

## Tech Stack

**Frontend:** React + Vite, JavaScript ES Modules, Tailwind CSS, React Router DOM, TanStack Query, Zustand, Tiptap, React Hook Form + Zod, Lucide React, Sonner, date-fns

**Backend:** Node.js, Express.js, JavaScript ES Modules, Supabase (PostgreSQL + Auth + Storage), Zod, Helmet, CORS, express-rate-limit

**Database:** Supabase PostgreSQL with Row Level Security (RLS), private Storage bucket, server-side service-role access only.

## Features

- **Authentication** — Supabase Auth (email/password), email verification, password reset, session restoration, protected routes.
- **24-hour inactivity session** — Server-tracked genuine activity; automatic logout after 24h of inactivity. Background processes (autosave, polling) do **not** extend the session.
- **Two parent themes** — Sakura Blossom (light) and Midnight Rose (dark), plus System mode.
- **Eight persistent floral note themes** — Each new note is randomly assigned one of eight themes (Sakura Pink, Lavender Garden, Botanical Garden, Midnight Rose, Blue Hydrangea, Peach Blossom, Daisy Minimal, Moonlit Garden). The theme is stored in PostgreSQL and applied to the entire application while the note is open; closing the note restores the parent theme.
- **Rich-text notes** — Tiptap editor with bold, italic, underline, strikethrough, headings, lists, task lists, blockquotes, code blocks, links, alignment, undo/redo, autosave with Saving/Saved/Error states.
- **Folders & tags** — Full CRUD, ownership-scoped, safe delete behaviour.
- **Journal** — Private journal entries with mood, tags, calendar view.
- **Personal Space** — Quick notes, checklists, links, snippets, categories.
- **Private Vault** — File upload (PDF, DOCX, XLSX, PPTX, TXT, images) to a private Supabase Storage bucket, signed URLs only, per-user isolation.
- **Reminders & notifications** — Date/time reminders, linkable to notes, upcoming/overdue views.
- **Settings** — Appearance, editor, account, privacy/security, preferences — all persisted in DB.
- **Global search** — Across notes, folders, tags, journal, personal space, vault metadata.

## Project Structure

```
BloomNotes/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # ui, layout, navigation, feature components
│   │   ├── contexts/    # AuthProvider, ThemeProvider
│   │   ├── hooks/       # useAuth, useTheme, useActivityTracker, ...
│   │   ├── lib/         # apiClient, supabaseClient, utils
│   │   ├── pages/       # public + protected pages
│   │   ├── services/    # API service modules
│   │   ├── store/       # Zustand stores
│   │   ├── styles/      # index.css with theme tokens
│   │   └── utils/       # helpers
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── server/              # Express backend
│   ├── src/
│   │   ├── config/      # env, supabase
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/  # auth, error, rateLimit, activity
│   │   ├── validators/
│   │   ├── utils/
│   │   └── jobs/        # session cleanup, reminder scheduler
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project (https://supabase.com)

### 1. Database

Open the Supabase SQL Editor and run:

```
supabase/migrations/0001_init.sql
```

This creates all tables, RLS policies, triggers, the storage bucket and storage policies.

### 2. Backend

```bash
cd server
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLIENT_URL, etc.
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
cp .env.example .env
# Fill in VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5173

## Documentation

- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Security Model](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT — for personal and educational use.
