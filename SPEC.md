# SPEC.md — Wedding RSVP App (Raffi & Nver)

## Purpose
Tokenized, per-guest wedding RSVP. Guests open a unique link, see an animated
invite, then RSVP Yes/No with party members (incl. under-18 flag). Admins (Raffi
& Nver) maintain the guest list, send tokenized links over WhatsApp, and track
responses.

**This repo is FRONTEND ONLY.** The n8n backend is built and hosted separately
(by the owner, not Claude Code). Build against the endpoint contracts below; do
not attempt to provision n8n or Google Sheets.

---

## Tech
- Vite + React + TypeScript
- React Router (HashRouter OR BrowserRouter + GitHub Pages `404.html` SPA fallback)
- Framer Motion for animation
- Plain CSS with CSS custom properties (design tokens). NO UI kit.
- Deploy target: GitHub Pages
- **Mobile-first.** Desktop is a centered, max-width adaptation, not a separate design.

---

## Design tokens (PLACEHOLDERS — owner will swap)
`src/styles/tokens.css`. Use vars everywhere; never hardcode color/font.
Reference style: dark green background, cream/off-white text, elegant serif
display for names, mono/letter-spaced caps for labels. Match the attached invite
image's *mood*. Ignore the phone numbers and RSVP-by line from the image.

```css
:root {
  --bg: #2f4a32;          /* deep green placeholder */
  --fg: #ece6d8;          /* cream placeholder */
  --fg-muted: #b9bfae;
  --accent: #ece6d8;
  --font-display: 'Times New Roman', serif;  /* placeholder serif */
  --font-label: ui-monospace, monospace;     /* placeholder mono */
  --maxw: 560px;
  --radius: 10px;
}
```

---

## Routes
- `/` and `/rsvp` — Invite (reads `?t=<token>` from query)
- `/admin` — Admin console (secret-gated via n8n; see below)

GitHub Pages does not server-side route. Use HashRouter, OR add `404.html` that
redirects to `index.html` preserving the path. Deep links MUST work
(`/rsvp?t=abc` shared over WhatsApp).

---

## Data model (owner's Google Sheets — for reference only)

**Guests** (one row per invited party):
```
guest_id | token | name | phone | max_party_size | sent_at | rsvp_status | responded_at
```

**Responses** (one row per attendee; soft-delete on edit):
```
token | first_name | last_name | under_18 | attending | submitted_at | active
```

`token` is the party identity. Edits = upsert: old rows `active=FALSE`, new rows
appended. Headcount = `COUNTIFS(active=TRUE, attending="Yes")`.

---

## Endpoint contracts (n8n — already built by owner)

Base URL provided via env: `VITE_API_BASE`.

### GET `{API_BASE}/resolve?t=<token>`
Resolves a token to guest + existing response.
- 200:
```json
{
  "name": "The Melkonian Family",
  "max_party_size": 4,
  "response": {
    "attending": "Yes",
    "submitted_at": "2026-06-20T14:00:00Z",
    "members": [
      { "first_name": "Sirag", "last_name": "Melkonian", "under_18": false }
    ]
  }
}
```
- `response: null` if not yet submitted → show blank form.
- 404 if token unknown → show a graceful "invalid invite link" state.
- Never returns phone or other guests' data.

### POST `{API_BASE}/rsvp`
Submit or edit an RSVP (same endpoint for both — it's an upsert).
Request:
```json
{
  "token": "abc123...",
  "attending": "Yes",                 // or "No"
  "turnstileToken": "<cf-token>",
  "honeypot": "",                     // hidden field, must be empty
  "members": [                        // empty/ignored if attending = "No"
    { "first_name": "Sirag", "last_name": "Melkonian", "under_18": false }
  ]
}
```
- 200 `{ "ok": true }`
- 400 on validation failure (missing names, party > max_party_size, bad token,
  honeypot filled, Turnstile fail). Show inline error, do not lose form state.

### GET `{API_BASE}/admin/guests`  (secret-gated)
Header `x-admin-secret: <secret>`. Returns full list for the admin console.
```json
[
  {
    "guest_id": "g1", "token": "abc", "name": "...", "phone": "9617...",
    "max_party_size": 4, "sent_at": "...|null",
    "rsvp_status": "Yes|No|null", "responded_at": "...|null",
    "headcount": 3, "kids": 1
  }
]
```
- 401 without valid secret.

### POST `{API_BASE}/admin/sent`  (secret-gated)
Header `x-admin-secret`. Body `{ "guest_id": "g1" }`. Stamps `sent_at` when the
admin clicks the WhatsApp button. 200 `{ "ok": true }`.

---

## Invite page (`/rsvp`) — behavior

**On load:** read `?t=`. If absent or `/resolve` 404 → show "This invite link
isn't valid — please check with Raffi or Nver" state, no form.

**Hero (full viewport, mobile-first):**
- Animated entrance (Framer Motion stagger): welcome line → "RAFFI & NVER"
  (display serif) → date (SAT 01 · 08 · 26) → ceremony time + address → reception
  block. Pull copy from the invite image; OMIT phone numbers and RSVP-by line.
- Two CTAs:
  - **RSVP** → smooth-scroll to the form section below.
  - **Can't make it** → one tap: POST `/rsvp` with `attending:"No"`, then show a
    warm farewell state ("We'll miss you — thank you for letting us know").
- A subtle animated scroll cue (bouncing chevron) so users know the form is below.

**Form section (revealed on scroll):**
- Yes/No toggle (defaults to Yes once they scroll in).
- If Yes: party member rows. **Default 2 rows.** Each row: First name, Last name,
  + an "Under 18" checkbox at the row end. "Add person" appends a row (animate in).
  Each row past the first has a remove button (animate out). Cap at
  `max_party_size`; disable "Add person" at the cap with a hint.
- If existing `response` returned from `/resolve`: hydrate the form, change submit
  label to **"Update RSVP"**, show "Last submitted: <date>".
- Hidden honeypot input (off-screen, `aria-hidden`, `tabindex=-1`).
- Cloudflare Turnstile widget (invisible/managed). Site key from `VITE_TURNSTILE_SITE_KEY`.
- Submit → POST `/rsvp`. On 200 show success animation. On 400 show inline error,
  keep state.

**Deadline:** July 15, 2026. SOFT — do NOT block. After the date, show a gentle
note ("RSVPs were due July 15, but please still let us know") and keep the form
fully functional.

**Validation (client, before POST):**
- Yes requires ≥1 member with both names non-empty.
- Trim names; reject empty/whitespace-only.
- Dedupe identical rows within the form (warn, don't hard-block).
- Enforce `max_party_size`.

---

## Admin page (`/admin`) — behavior

- On load, prompt for the admin secret (simple password input). Store in memory
  only (not localStorage). Send as `x-admin-secret` on every admin call.
- On 401, show "wrong passcode," let them retry.
- **Guest list table** (mobile: cards): name, phone, status badge
  (Pending / Yes / No), headcount, kids, sent indicator.
- **WhatsApp send button** per row:
  ```js
  const msg = encodeURIComponent(
    `Hi ${name}! Raffi & Nver would love to celebrate with you. RSVP here: ${SITE_URL}/rsvp?t=${token}`
  );
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  // then POST /admin/sent { guest_id } to stamp sent_at, optimistically update UI
  ```
  `phone` = intl digits only, no `+` or spaces.
- **Dashboard** (top of page): total invited, responded, pending, attending
  headcount, kids count. Derive from the guests payload.
- Filter/sort: by status, by not-yet-sent. Search by name.

---

## Security (frontend responsibilities)
- Turnstile token included on every `/rsvp` POST.
- Honeypot field present and validated client-side (empty) before submit.
- Admin secret never persisted to storage; memory only.
- No PII (phone) ever rendered on the guest-facing invite page.
- All secrets/keys via Vite env vars, never committed:
  `VITE_API_BASE`, `VITE_TURNSTILE_SITE_KEY`, `VITE_SITE_URL`.

---

## Env (`.env`, gitignored; provide `.env.example`)
```
VITE_API_BASE=https://n8n.arachne-t.com/webhook/rsvp
VITE_TURNSTILE_SITE_KEY=xxxx
VITE_SITE_URL=https://<user>.github.io/rsvp-raffi-nver
```

---

## Build order (FOLLOW THIS — checkpoint enforced)
1. Scaffold Vite + React + TS + router + GitHub Pages SPA fallback (`404.html`).
2. `tokens.css` placeholders + `Hero` component: full animated invite, static
   copy from the image, scroll cue, two CTAs (CTAs non-functional stub for now).
3. `RsvpForm`: local state only, no backend. Yes/No, 2 default rows, add/remove
   with animation, under-18 checkbox, max-party cap, client validation.
   **→ STOP HERE. Show the owner the Invite page UX (hero + form) on a phone
   viewport before wiring any backend. Do not proceed until approved.**
4. `lib/api.ts`: typed clients for all 4 endpoints + types.
5. Wire form → `/resolve` (hydrate/edit) + `/rsvp` (submit). Success/error states.
6. "Can't make it" one-tap No flow + farewell state.
7. Admin route: secret gate, guest list, WhatsApp button + `/admin/sent`, dashboard.
8. Turnstile + honeypot + CORS-aware fetch + env wiring.
9. Deploy to GitHub Pages. Smoke test on a real phone: deep link, submit, edit,
   No flow, admin send.

---

## Explicit non-goals
- No server-side rendering. No auth system (single shared admin secret only).
- No automated WhatsApp send (manual `wa.me` only).
- No real-time. No localStorage persistence of form state.
- Do not build/provision n8n or Google Sheets — owner owns the backend.

---

## Notes for the owner (not Claude Code)
- Register Cloudflare Turnstile before step 8; put site key in frontend env,
  secret in n8n env.
- Pick `ADMIN_SECRET` now; set it in n8n env, share it with Nver only.
- n8n workflow JSON + node config is delivered separately (in chat).
