# Wedding RSVP — Raffi & Nver

Tokenized, per-guest wedding RSVP frontend. Guests open a unique link, see an
animated invite, and RSVP Yes/No with their party. Admins manage the guest list,
send tokenized links over WhatsApp, and track responses.

Frontend only — the n8n backend is hosted separately. See `SPEC.md`.

## Stack
Vite + React + TypeScript · React Router · Framer Motion · plain CSS tokens.
Mobile-first; deployed to GitHub Pages with a `404.html` SPA fallback so clean
deep links (`/rsvp?t=…`) work.

## Develop
```bash
npm install
cp .env.example .env   # fill in values (uses the always-pass Turnstile test key)
npm run dev
```

Routes: `/` and `/rsvp` (invite, reads `?t=`), `/admin` (console).

## Environment
| Var | Purpose |
|---|---|
| `VITE_API_BASE` | n8n webhook base (paths: `/rsvp-resolve`, `/rsvp-submit`, `/rsvp-admin-guests`, `/rsvp-admin-sent`) |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (test key for dev, real key for prod) |
| `VITE_SITE_URL` | Public site URL, used to build WhatsApp RSVP links |

The admin passcode is typed at runtime and kept in memory only — never committed
or persisted. `.env*` files are gitignored.

## Build & deploy (GitHub Pages, project subpath)
```bash
VITE_BASE_PATH=/wedding-rsvp/ npm run build   # loads .env.production
# publish dist/ to the gh-pages branch
```
