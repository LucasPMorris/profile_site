# Profile Site Migration Guide

Complete analysis and migration reference for redesigning the profile site while preserving the existing production database and data layer.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema — The Contract](#2-database-schema--the-contract)
3. [External Service Integrations](#3-external-service-integrations)
4. [API Routes to Preserve or Recreate](#4-api-routes-to-preserve-or-recreate)
5. [Environment Variables](#5-environment-variables)
6. [Server-Side Infrastructure](#6-server-side-infrastructure)
7. [Static Content & MDX System](#7-static-content--mdx-system)
8. [Current UI Inventory (for reference only)](#8-current-ui-inventory-for-reference-only)
9. [Migration Checklist](#9-migration-checklist)
10. [Risks & Recommendations](#10-risks--recommendations)

---

## 1. Architecture Overview

**Current Stack:**
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (Pages Router) → **Next.js 16.x (App Router)** |
| Runtime | React 19 |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Render, Oregon) |
| ORM | Prisma 6.14 |
| Styling | Tailwind 3.3 + Emotion |
| Animations | Framer Motion 12.x + AOS |
| Data Fetching | SWR 2.3 + getStaticProps (ISR) |
| Server | Custom Express wrapper (cron jobs) |
| Deployment | Render (DB) |
| SEO | next-seo + next-sitemap |
| Theme | next-themes (class-based dark/light) |

**Target Stack: Next.js 16.x + React 19 (App Router)**

Key implications of this move:
- **Pages Router → App Router** — all routes move from `src/pages/` to `src/app/`. API routes become Route Handlers (`route.ts`). `getStaticProps`/`getServerSideProps` are replaced by React Server Components, `fetch` with caching, and `generateStaticParams`.
- **React Server Components by default** — most data fetching moves server-side, reducing client bundle. SWR/client fetching only needed for real-time UI (e.g. now-playing, live stats).
- **`next-seo` likely unnecessary** — Next.js 16 has built-in `metadata` API and `generateMetadata` for SEO.
- **Custom Express server for cron jobs** — required for Render deployment. Port `server.js` as-is.
- **SWR** — still useful for client-side polling (Spotify now-playing, dashboard), but most page data can be fetched in Server Components directly.
- **Emotion** — may have RSC compatibility issues. Consider Tailwind-only or CSS Modules for the new build.

---

## 2. Database Schema — The Contract

**This is the most critical section.** The production database will remain unchanged. Your new UI must be compatible with this exact schema.

**Connection:**
```
provider: postgresql
url: env("DATABASE_URL")
directUrl: env("DIRECT_URL")
relationMode: "prisma"
```

### 2.1 Content Models

#### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | Int (PK, auto) | |
| title | String | |
| slug | String (unique) | URL path segment |
| description | String | |
| image | String | Featured image path/URL |
| link_demo | String? | Live demo URL |
| link_github | String? | Source code URL |
| stacks | String | Comma-separated tech stack |
| is_show | Boolean (default true) | Visibility toggle |
| updated_at | DateTime | |
| content | String? | Full project writeup (markdown) |
| is_featured | Boolean (default false) | Homepage feature flag |
| rawMD | Boolean (default false) | If true, content is raw markdown (not MDX) |

#### `blogPost`
| Column | Type | Notes |
|--------|------|-------|
| id | Int (PK, auto) | |
| date | DateTime | Publication date |
| modified | DateTime | Last modified |
| slug | String (unique) | URL path segment |
| status | String | e.g. "publish" |
| link | String | Permanent link |
| title | String | |
| contentHtml | String | Pre-rendered HTML |
| contentMarkdown | String | Source markdown |
| contentProtected | Boolean | |
| excerptHtml | String | Short HTML excerpt |
| excerptProtected | Boolean | |
| authorId | Int (FK → user) | |
| featuredMediaId | Int? (FK → media) | |
| sticky | Boolean | Pinned post |
| template | String | |
| format | String | |
| footnotes | String | |
| featuredImageUrl | String? | Direct image URL |
| totalViewsCount | Int (default 0) | Aggregated view count |
| rawMD | Boolean (default false) | Raw markdown flag |

**Relations:** author (user), featuredMedia (media), categories (many-to-many), tags (many-to-many), attachments (one-to-many), terms (one-to-many)

#### `user`
| Column | Type | Notes |
|--------|------|-------|
| user_id | Int (PK) | |
| name | String | |
| username | String (unique) | |
| twitterUsername | String? | |
| githubUsername | String? | |
| websiteUrl | String? | |
| profileImage | String? | |

#### `category` / `tag`
Both have: `id` (Int PK), `name` (String), `slug` (String)
Many-to-many with blogPost via implicit join tables (`_PostCategories`, `_PostTags`).

#### `media`
`id`, `url`, `description?` — linked to blogPost as featured media.

#### `attachment`
`id`, `href`, `postId` (FK) — linked to blogPost.

#### `term`
`id`, `taxonomy`, `embeddable`, `href`, `postId` (FK) — taxonomy terms linked to blogPost.

#### `contentmeta` (View Tracking)
| Column | Type | Notes |
|--------|------|-------|
| id | Int (PK) | |
| slug | String (unique) | Content identifier |
| type | String | "blog", "project", etc. |
| views | Int (default 0) | View count |
| updated_at | DateTime | |

### 2.2 Spotify Data Models

This is the largest and most complex part of the schema — a full listening analytics pipeline.

#### Core Entities
- **`spartist`** — `artist_id` (String PK, Spotify ID), `name`, `image_url?`, `artist_url?`, timestamps
- **`spalbum`** — `album_id` (String PK), `name`, `release_date?`, `image_url?`, timestamps
- **`sptrack`** — `track_id` (String PK), `title`, `duration?`, `song_url?`, `explicit`, `release_date?`, `album_id` (FK), `isrc?`, `common_album_id?` (FK for dedup), timestamps

#### Relationship Tables
- **`sptrackartist`** — composite PK (`track_id`, `artist_id`)
- **`spalbumartist`** — composite PK (`album_id`, `artist_id`), cascade delete

#### Play History
- **`spplayhistory`** — `id` (auto PK), `track_id` (FK), `played_at` (DateTime), unique on (`track_id`, `played_at`)
- **`spdailyplaystats`** — `id`, `date` (unique), `weekday`, `hourly_plays` (JSON: array of 24 ints)

#### Time-Bucketed Statistics (Hierarchical)
```
yearbucket → monthbucket → daybucket
     ↓              ↓            ↓
 artiststat     artiststat   artiststat
 trackstat      trackstat    trackstat
```

- **`yearbucket`** — `id`, `year`, `range_start`, `range_end`
- **`monthbucket`** — `id`, `month`, `range_start`, `range_end`, `yearbucketid` (FK)
- **`daybucket`** — `id`, `start_date`, `bucket_scope` ("day"), `monthbucketid` (FK)
- **`artiststat`** — `id`, `artist_id` (FK), `count`, `hourly_plays?` (JSON), `stat_date`, `bucket_scope`, optional FKs to year/month/day buckets. Unique constraints on (artist_id + bucket_id) pairs.
- **`trackstat`** — Same structure as artiststat but for tracks.

### 2.3 Implicit Join Tables (Prisma-managed)
- `_PostCategories` — columns `A` (blogPost.id), `B` (category.id)
- `_PostTags` — columns `A` (blogPost.id), `B` (tag.id)

> **Important:** `relationMode = "prisma"` means foreign keys are enforced at the Prisma level, NOT at the database level. The database has no FK constraints. This means you can technically use any ORM or raw SQL — just be careful about referential integrity.

---

## 3. External Service Integrations

These integrations are independent of UI and must be preserved in the new site.

### 3.1 Spotify (Most Complex)
- **OAuth2 Refresh Token flow** — exchanges refresh token for access token on each call
- **Endpoints used:**
  - Token: `https://accounts.spotify.com/api/token`
  - Now Playing: `https://api.spotify.com/v1/me/player/currently-playing`
  - Recently Played: `https://api.spotify.com/v1/me/player/recently-played?limit=50`
  - Devices: `https://api.spotify.com/v1/me/player/devices`
  - Artists: `https://api.spotify.com/v1/artists?ids={ids}`
- **Ingestion service** (`src/services/spotifyIngestion.ts`): fetches recent plays, upserts tracks/artists/albums, deduplicates via ISRC
- **Aggregation service**: builds daily stats with hourly breakdowns, populates bucket hierarchy
- **Complex stats query** (`getSpotifyStatsByDateRange`): uses raw SQL for aggregations across the bucket system

### 3.2 GitHub
- **GraphQL API** (`https://api.github.com/graphql`)
- **Two accounts:** personal + work (separate tokens)
- **Data:** Contribution calendar (weeks, days, colors, counts)

### 3.3 WakaTime
- **REST API** with HTTP Basic Auth
- **Endpoints:** `/stats/last_7_days`, `/all_time_since_today`
- **Data:** Languages, editors, daily averages, best day

### 3.4 Contact Form
- **Web3Forms** (`https://api.web3forms.com/submit`)
- Simple POST with API key + form data

### 3.5 Legacy/Inactive
- **OpenAI** (text-davinci-003) — deprecated, no active routes
- **Firebase** — env vars configured, not actively used

---

## 4. API Routes to Preserve or Recreate

### Must-Have (Data Pipeline & Core Features)

| Route | Method | Purpose | Depends On |
|-------|--------|---------|-----------|
| `/api/getspotifyhistory` | POST | Spotify ingestion (cron) | Spotify API + Prisma |
| `/api/aggregatedailystats` | POST | Stats aggregation (cron) | Prisma |
| `/api/spotify` | GET | Stats by date range | Prisma (raw SQL) |
| `/api/now-playing` | GET | Current Spotify track | Spotify API |
| `/api/projects` | GET | All projects | Prisma |
| `/api/blog` | GET | Blog posts (paginated, searchable) | Prisma |
| `/api/views` | GET/POST | View count tracking | Prisma |
| `/api/github` | GET | GitHub contributions | GitHub GraphQL |
| `/api/read-stats` | GET | WakaTime coding stats | WakaTime API |
| `/api/contact` | POST | Contact form | Web3Forms |

### Nice-to-Have

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/available-devices` | GET | Spotify devices list |
| `/api/snippets` | GET | MDX file counts |
| `/api/images` | GET | List public images |
| `/api/admin/*` | CRUD | Blog admin panel |

---

## 5. Environment Variables

### Required for Core Functionality
```bash
# Database
DATABASE_URL=           # PostgreSQL connection string
DIRECT_URL=             # Direct connection (bypasses pooling)

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# GitHub
GITHUB_READ_USER_TOKEN_PERSONAL=
GITHUB_READ_USER_TOKEN_WORK=

# WakaTime
WAKATIME_API_KEY=

# Contact
CONTACT_FORM_API_KEY=

# Admin
ADMIN_TOKEN=

# Site
SITE_URL=
```

### Optional / Legacy
```bash
OPENAI_API_KEY=                     # Legacy, not actively used
BLOG_API_URL=                       # If external blog source
NEXT_PUBLIC_FIREBASE_*=             # Firebase (inactive)
GOOGLE_CLIENT_ID/SECRET=            # NextAuth (not implemented)
GITHUB_ID/SECRET=                   # NextAuth (not implemented)
```

---

## 6. Server-Side Infrastructure

### Cron Jobs (Currently via Express + node-cron)

The custom `server.js` wraps Next.js in Express and runs two cron jobs in production:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `*/30 * * * *` (every 30 min) | POST `/api/getspotifyhistory` | Ingest Spotify plays |
| `10 */6 * * *` (every 6 hrs) | POST `/api/aggregatedailystats` | Aggregate daily stats |

**Migration approach:** Keep the Express wrapper (`server.js`) with `node-cron`. This is required by the Render deployment and budget constraints. Copy it to the new project and update any import paths as needed.

---

## 7. Static Content & MDX System

### Snippets (File-based content)
- Location: `src/contents/snippets/[category]/[slug].mdx`
- Parsed with `gray-matter` for frontmatter
- Categories defined in `src/common/constant/` TypeScript files (not DB)
- Frontmatter fields: `id`, `chapter_id`, `chapter_title`, `title`, `category`, `language`, `difficulty`, `source`, `cover_url`, `source_url`, `created_at`, `updated_at`, `is_playground`, `initial_code`

### MDX Custom Components
The current MDX renderer provides these custom elements that content depends on:
- **Headers** (h1-h3) with auto-generated IDs (for TOC)
- **Code blocks** with syntax highlighting, copy button, collapse, JSON viewer
- **`TestItOut`** — interactive code executor (JS/HTML/CSS)
- **`CallOut`** — highlighted callout boxes
- **Links** — internal vs external handling
- **Tables** — styled with dark mode support
- **Blockquotes** — styled with left border
- **Images** — Next/Image with blur loading

> The amount of content using custom `data-component` attributes (`TestItOut`, `CallOut`) is limited. Plan to reformat that content to fit your new rendering approach rather than maintaining backwards compatibility.

### Content in Database
- Blog posts store both `contentHtml` (pre-rendered) and `contentMarkdown` (source)
- Projects store `content` as markdown
- The `rawMD` flag indicates whether to render as raw markdown or as MDX

---

## 8. Current UI Inventory (For Reference Only)

This section documents what exists today. You are free to completely redesign all of it.

### Pages & Sections
| Page | Key Sections |
|------|-------------|
| Home | Hero/intro, blog preview carousel, skills/tech stack, services |
| About | Tabbed: story, resume, career timeline |
| Dashboard | Spotify stats (heatmap, top artists/tracks, overview), GitHub coding stats, contribution calendar |
| Projects | Grid with load-more, featured filter |
| Blog | Featured hero, search, paginated cards |
| Blog Detail | Header, MDX content, TOC, view counter |
| Project Detail | Image, MDX content, floating TOC, tech stack |
| Snippets | Category cards → chapter list → detail with TOC |
| Playground | Monaco editor with multiple modes (JS, HTML, CSS, MD, Regex) |
| Contact | Form + social links + book-a-call |
| Admin | Blog CRUD (create, edit, delete) |

### Current Dependencies (UI-specific)
These are purely presentation-layer and can be swapped freely:
- `framer-motion` — animations
- `@headlessui/react` — command palette, dropdowns
- `react-slick` / `slick-carousel` — carousels
- `react-icons` — icons
- `react-syntax-highlighter` — code blocks
- `@monaco-editor/react` — playground editor
- `react-hot-toast` — toasts
- `react-datepicker` — date range picker
- `react-loading-skeleton` — skeleton loaders
- `react-infinite-scroll-component` — infinite scroll
- `react-json-view` — JSON display
- `nprogress` — page transition progress bar
- `aos` — scroll animations
- `typewriter-effect` — typing animation
- `@emotion/react` + `@emotion/styled` — styled components

---

## 9. Migration Checklist

### Phase 1: Foundation
- [ ] Initialize new Next.js 16.x project with App Router (`create-next-app`)
- [ ] Configure TypeScript, Tailwind, linting
- [ ] Set up Prisma with the **exact same schema** — copy `prisma/schema.prisma` verbatim
- [ ] Run `prisma generate` (do NOT run `prisma migrate` — the DB already exists)
- [ ] Verify database connectivity and test a simple query
- [ ] Set up all environment variables

### Phase 2: Data Layer
- [ ] Port `src/common/libs/prisma.ts` (singleton pattern)
- [ ] Port `src/common/types/` — all TypeScript interfaces
- [ ] Convert API routes to App Router Route Handlers (`app/api/*/route.ts`)
- [ ] Port `src/services/spotify.ts` (OAuth + data fetching)
- [ ] Port `src/services/spotifyIngestion.ts` (ingestion pipeline)
- [ ] Port `src/services/github.ts` (GraphQL client)
- [ ] Port `src/services/wakatime.ts`
- [ ] Port `src/services/contact.ts`
- [ ] Port `src/services/fetcher.ts` (SWR/data fetching helper)
- [ ] Set up cron job mechanism for Spotify ingestion

### Phase 3: Content System
- [ ] Copy `src/contents/` directory (MDX files)
- [ ] Port or rewrite MDX loading utilities (`src/common/libs/mdx.ts`)
- [ ] Build new MDX/markdown renderer for the new UI
- [ ] Reformat any content using old custom `data-component` attributes to fit new approach

### Phase 4: New UI
- [ ] Design and build new layout system
- [ ] Build new navigation
- [ ] Build new pages (home, about, blog, projects, dashboard, snippets, contact)
- [ ] Build Spotify dashboard visualizations
- [ ] Build GitHub contribution display
- [ ] Build blog listing + detail views
- [ ] Build project listing + detail views
- [ ] Build admin panel (or replace with a CMS)
- [ ] Implement dark/light mode
- [ ] Implement SEO via Next.js `metadata` API / `generateMetadata` (replaces `next-seo`)

### Phase 5: Infrastructure
- [ ] Set up deployment pipeline
- [ ] Configure cron jobs for production
- [ ] Set up domain/DNS
- [ ] Test with production database (read-only first)
- [ ] Verify Spotify ingestion works in new environment
- [ ] Smoke test all API routes
- [ ] Switch DNS / deploy

---

## 10. Risks & Recommendations

### Critical Risks
1. **Prisma `relationMode: "prisma"`** — The DB has NO foreign key constraints. If you switch ORMs (e.g., Drizzle), you must handle referential integrity yourself, or add real FK constraints to the DB first.
2. **Raw SQL in Spotify stats** — `getSpotifyStatsByDateRange` uses raw SQL queries. If switching ORMs, these need careful porting.
3. **Implicit join tables** — `_PostCategories` and `_PostTags` are Prisma-managed implicit many-to-many tables. Other ORMs won't auto-handle these; you'd need explicit join table models.

### Recommendations
1. **Keep Prisma** — Given the complex schema and existing data, Prisma is the path of least resistance. If you switch to Drizzle or another ORM, budget significant time for the Spotify stats queries.
2. **Keep the Express wrapper for ingestion** — The cron-based ingestion via `server.js` is a deployment constraint (Render + budget). Port this wrapper as-is to the new project.
4. **Keep the schema frozen during migration** — Do NOT modify the Prisma schema until the new site is fully functional against the existing data. Schema changes come after the UI migration.
5. **Incremental migration** — Consider running both sites in parallel during transition (old site live, new site on preview URL) to validate data rendering before cutting over.
6. **Copy, don't rewrite, service files** — `spotifyIngestion.ts`, `spotify.ts`, `github.ts`, and `wakatime.ts` are stable data-layer code. Copy them into the new project and adapt imports rather than rewriting from scratch.
7. **MDX content can be reformatted** — The existing content using custom `data-component` attributes (`TestItOut`, `CallOut`) is limited. Rather than building a backwards-compatible MDX renderer, reformat that content to fit whatever new rendering approach you choose. This is an opportunity to simplify the content pipeline.
