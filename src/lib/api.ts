// Typed clients for the n8n webhook endpoints.
//
// Base + paths (per the live backend; these override the older SPEC paths):
//   GET  {API_BASE}/rsvp-resolve?t=<token>
//   POST {API_BASE}/rsvp-submit
//   GET  {API_BASE}/rsvp-admin-guests   (header x-admin-secret)
//   POST {API_BASE}/rsvp-admin-sent     (header x-admin-secret)

import type { AdminGuest, ResolveResult, SubmitPayload } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')

/** Thrown for any non-2xx response or network failure. `status === 0` = network/CORS error. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
  get isNotFound() {
    return this.status === 404
  }
  get isUnauthorized() {
    return this.status === 401
  }
  get isValidation() {
    return this.status === 400
  }
  get isNetwork() {
    return this.status === 0
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  adminSecret?: string
  signal?: AbortSignal
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, adminSecret, signal } = opts

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (adminSecret) headers['x-admin-secret'] = adminSecret

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      mode: 'cors',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // Network down, DNS failure, or CORS rejection — surface as a network ApiError.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, 'Network error — please check your connection and try again.')
  }

  // Parse a body if present; tolerate empty/non-JSON responses.
  let parsed: unknown
  const text = await res.text()
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, `Request to ${path} failed (${res.status})`, parsed)
  }
  return parsed as T
}

/** GET /rsvp-resolve?t=<token>. Throws ApiError(404) for an unknown token. */
export function resolveRsvp(token: string, signal?: AbortSignal): Promise<ResolveResult> {
  return request<ResolveResult>(`/rsvp-resolve?t=${encodeURIComponent(token)}`, { signal })
}

/** POST /rsvp-submit. Throws ApiError(400) on validation failure. */
export function submitRsvp(
  payload: SubmitPayload,
  signal?: AbortSignal
): Promise<{ ok: true }> {
  return request<{ ok: true }>('/rsvp-submit', { method: 'POST', body: payload, signal })
}

/** GET /rsvp-admin-guests. Throws ApiError(401) when the secret is wrong/missing. */
export function fetchAdminGuests(
  adminSecret: string,
  signal?: AbortSignal
): Promise<AdminGuest[]> {
  return request<AdminGuest[]>('/rsvp-admin-guests', { adminSecret, signal })
}

/** POST /rsvp-admin-sent — stamp sent_at for a guest after the WhatsApp hand-off. */
export function markGuestSent(
  adminSecret: string,
  guestId: string,
  signal?: AbortSignal
): Promise<{ ok: true }> {
  return request<{ ok: true }>('/rsvp-admin-sent', {
    method: 'POST',
    body: { guest_id: guestId },
    adminSecret,
    signal,
  })
}
