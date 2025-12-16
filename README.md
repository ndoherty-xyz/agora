# Agora

> From ancient Greek ἀγορά (agorá) - a central public space in ancient Greek city-states where people gathered for assemblies, markets, and civic discourse.

A collaborative web document editor where anyone can edit a single global document in real-time.

## What It Is

Single global document that anyone can access and edit simultaneously. Changes sync instantly across all connected users. You can optionally link your Twitter/X account to "sign" your edits, or stay anonymous with a randomly assigned Greek mythology name.

### Features
- Real-time collaborative editing (multiple cursors, live presence)
- Rich text formatting (bold, italic, etc)
- Image embeds via URL
- Link previews with cards
- Twitter/X attribution for edits (optional)
- AI-powered content moderation
- Persistent document state (survives server restarts)

## Stack

**Frontend**
- Next.js 14 (App Router)
- Tiptap (ProseMirror-based rich text editor)
- Yjs (CRDT for conflict-free sync)
- Tailwind CSS v4
- shadcn UI components

**Backend**
- Express + express-ws
- Hocuspocus (Yjs WebSocket server)
- Drizzle ORM
- PostgreSQL
- OpenAI Moderation API

**Deployment**
- Frontend: Railway
- Backend: Railway
- Database: Railway Postgres

## How It Works

The collaboration stack is built on Yjs, a CRDT (Conflict-Free Replicated Data Type) implementation:

1. You type a character in the Tiptap editor
2. y-prosemirror converts it to a tiny Yjs operation
3. Operation gets broadcast through Hocuspocus WebSocket
4. Hocuspocus server applies it to server-side Y.Doc and broadcasts to other clients
5. Other clients receive and apply the update
6. Everyone's editor syncs to match

This is how multiple people can edit simultaneously without conflicts.

## Moderation System

This is where it gets interesting. We can't moderate every keystroke (would need to call OpenAI API for every letter typed, which is insane), so we use a two-tier approach:

### Text Moderation

**Tier 1: Full Document Check**
- Every 10s, if a change has been made since the last check, we do a moderation with the full document text
- If clean, done (1 API call)
- If flagged, proceed to Tier 2

**Tier 2: Binary Search to Find Specific Bad Nodes**

Instead of checking each text node individually (could be 100+ API calls), we use divide-and-conquer:

1. Split document in half
2. Check both halves (as text) in parallel
3. Recurse into flagged halves only
4. When down to single node, delete it

This reduces API calls from O(n) to O(log n). For a document with 100 text nodes:
- Naive approach: 100 API calls
- Binary search: ~7-8 API calls (log₂(100))

Worst case is still O(n) if everything is flagged, but that's rare.

**Implementation Details:**
- Uses Yjs transaction origins to prevent infinite loops (moderation deletions don't trigger moderation)
- Concurrency flag prevents overlapping moderation runs
- Groups deletions by parent and sorts indices descending to avoid index shifting

### Image Moderation

Simpler than text, can't binary search them. Instead:

1. Extract all image URLs from document
2. Check database cache (same URL likely posted multiple times)
3. Moderate any uncached URLs via OpenAI
4. Delete flagged images
5. Cache results for future

Runs in parallel with text moderation's initial check.

**Caching:**
```sql
CREATE TABLE moderated_images (
  url TEXT PRIMARY KEY,
  flagged BOOLEAN NOT NULL,
  moderated_at TIMESTAMP DEFAULT NOW()
);
```

We keep query params in URLs, stripping them could break signed URLs or CDN transformations. Downside is same image with different params gets moderated twice, but that's acceptable.

### Tradeoffs

**Why not moderate before sync?**
- Would block real-time collaboration (waiting for API response)
- Destroys the "feels instant" UX
- Burns through API quota

**Current approach:**
- Content is visible briefly (~10-15 seconds) before removal if flagged
- Acceptable for this use case
- Prevents abuse without killing the collaborative vibe

## Yjs Document Structure

Yjs stores the document as a tree:

```
Y.Doc
  └─ Y.XmlFragment ('default')
      ├─ Y.XmlElement (paragraph)
      │   └─ Y.XmlText (actual text)
      ├─ Y.XmlElement (heading)
      │   └─ Y.XmlText
      └─ Y.XmlElement (image)
          └─ attribute: src="..."
```

Server-side extraction uses `.toDelta()` because there's no browser `document` object to use `.toDOM()` with.

## Running Locally

```bash
# Start PostgreSQL
docker compose up -d

pnpm install

# Terminal 1 - Backend
cd apps/backend
pnpm dev

# Terminal 2 - Frontend  
cd apps/frontend
pnpm dev
```

Backend: http://localhost:3001
Frontend: http://localhost:3000
WebSocket: ws://localhost:3001/collaborate

## Monorepo Structure

pnpm workspaces setup:

```
apps/
  server/      # express + hocuspocus
  web/         # next.js frontend
```

## Environment Variables

**apps/server/.env**
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_CALLBACK_URL=...
```

**apps/web/.env**
```
NEXT_PUBLIC_SERVER_URL=...
NEXT_PUBLIC_WEBSOCKET_URL=...
```

## Notes

- Using Greek mythology names for anonymous users (fitting given the project name)
- Twitter OAuth is optional
- Document persists as Yjs binary blob in PostgreSQL
- Hocuspocus handles all the WebSocket complexity
- Moderation is async and non-blocking to prioritize UX
- Single global doc means no routing complexity, but could get large over time

## Future Improvements

- Admin panel for rollbacks/version history
- Rate limiting per IP/user
- Cache expiration for moderation results
