# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Personal Music Notebook app — a beautifully designed digital diary for music studies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifacts/music-notebook)
- **UI**: TailwindCSS v4, Lucide icons, Cormorant Garamond + Jost fonts

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── music-notebook/     # React+Vite frontend (at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── ...
```

## App Features

- **Title**: "Leshukov Music Diary" — subtitle "A Thesaurus of Musical Knowledge"
- **Sections (in order)**: Chronicle (daily diary, auto-creates today's entry on editor login), Music (pieces by composer), Composers (biographies + linked pieces), Methodical Books (covers + synopsis), Masterclasses (entries stored via notes section="masterclasses"), Notes (general notes, section="notes")
- **Edit mode**: 4-digit PIN `1707` in top-right header button (stored in sessionStorage)
- **Section filtering**: notes table `section` field — "chronicle" | "masterclasses" | "notes" | "journal" etc.
- **Composer photos**: Display portrait photo if available, elegant initial fallback
- **Links**: Composer detail → linked pieces → piece detail page
- **Search**: All list pages (Music, Composers, Masterclasses, Methodical Books, Notes) have search bars
- **Rich block editor (ArticleEditor.tsx)**: Block types: text, heading, subheading, image (with size control: small/medium/large/full), score, pdf, quote, timestamp (Music only), video embed (non-Music sections)
- **Timestamp blocks**: In Music/PieceDetail, clicking a timestamp seeks the YouTube player (postMessage API, `?enablejsapi=1`)
- **Video embed blocks**: In Masterclass, Book, Composer editors — embeds YouTube videos inline
- **MasterclassDetail**: Full block editor with edit/save flow, video embed support
- **BookDetail**: Full block editor for Reading Notes section, video embed support
- **ComposerDetail**: Classical book-cover portrait layout, block editor for biography, video embed support
- **Notes**: Simple text + photo notes (plain text paragraphs, no block editor)

## Database Tables

- `pieces` — musical pieces with composerId link
- `composers` — composer biographies + imageUrl
- `notes` — chapter notes/longreads (section field for grouping)
- `books` — methodical books with cover + synopsis + notes

## API Routes

- `POST /api/auth/verify` — verify password (1707)
- CRUD: `/api/pieces`, `/api/composers`, `/api/notes`, `/api/books`
- `POST /api/upload` — image upload (multipart), returns `{ url }` — uploads to Replit Object Storage (persistent)
- `GET /api/uploads/:filename` — serve uploaded images (local fallback only)
- `GET /api/inspiration` — AI-generated music quote/fact/recommendation (gpt-5-mini, max 1500 tokens)

## Home Page

- Route `/` shows HomePage with random AI-generated music inspiration (quote, fact, or recommendation)
- Clicking "Leshukov Music Diary" title navigates to `/` (home/inspiration page)
- Inspiration refreshes on demand with "Another inspiration" button

## Design

- Warm parchment palette: `--bg: #f0e9df`, `--paper: #faf6f0`, `--ink: #1a1510`, `--rust: #7c3a1a`
- Fonts: Cormorant Garamond (serif headings), Jost (sans body)
- High contrast text — all muted text at minimum 28% lightness
