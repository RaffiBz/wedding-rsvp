// Shared domain types. Mirrors the n8n endpoint contracts.

export type Attending = 'Yes' | 'No'

/** One person in a party (an RSVP member / attendee). */
export interface Member {
  first_name: string
  last_name: string
  under_18: boolean
}

/** Existing RSVP returned by /rsvp-resolve when the party has already responded. */
export interface RsvpResponse {
  attending: Attending
  submitted_at: string
  members: Member[]
}

/** GET /rsvp-resolve?t=<token> */
export interface ResolveResult {
  name: string
  max_party_size: number
  response: RsvpResponse | null
}

/** POST /rsvp-submit body */
export interface SubmitPayload {
  token: string
  attending: Attending
  turnstileToken: string
  honeypot: string
  env: 'prod'
  members: Member[]
}

/** GET /rsvp-admin-guests row */
export interface AdminGuest {
  guest_id: string
  token: string
  name: string
  phone: string
  max_party_size: number
  sent_at: string | null
  rsvp_status: 'Yes' | 'No' | null
  responded_at: string | null
  env: string
  headcount: number
  kids: number
}
