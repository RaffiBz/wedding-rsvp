import { useMemo, useState } from 'react'
import { ApiError, fetchAdminGuests, markGuestSent } from '../lib/api'
import type { AdminGuest } from '../types'
import './admin.css'

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/+$/, '')

type StatusFilter = 'all' | 'Yes' | 'No' | 'pending'

function statusOf(g: AdminGuest): 'Yes' | 'No' | 'pending' {
  return g.rsvp_status === 'Yes' ? 'Yes' : g.rsvp_status === 'No' ? 'No' : 'pending'
}

function whatsappLink(g: AdminGuest): string {
  const phone = String(g.phone ?? '').replace(/\D/g, '') // intl digits only, no + or spaces
  // Hash form so the link is HTTP 200 on GitHub Pages (and previews correctly).
  const msg = encodeURIComponent(
    `Hi ${g.name}! Raffi & Nver would love to celebrate with you. RSVP here: ${SITE_URL}/#/rsvp?t=${g.token}`
  )
  return `https://wa.me/${phone}?text=${msg}`
}

export default function Admin() {
  // Admin secret lives in memory only — never localStorage/sessionStorage.
  const [secret, setSecret] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  const [guests, setGuests] = useState<AdminGuest[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [notSentOnly, setNotSentOnly] = useState(false)
  const [actionError, setActionError] = useState('')

  async function authenticate(e: React.FormEvent) {
    e.preventDefault()
    const candidate = passcode.trim()
    if (!candidate) return
    setAuthBusy(true)
    setAuthError('')
    try {
      const list = await fetchAdminGuests(candidate)
      setGuests(list)
      setSecret(candidate)
      setPasscode('')
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        setAuthError('Wrong passcode — please try again.')
      } else if (err instanceof ApiError && err.isNetwork) {
        setAuthError(err.message)
      } else {
        setAuthError('Could not load the guest list. Please try again.')
      }
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSend(g: AdminGuest) {
    setActionError('')
    // Open WhatsApp first (must be inside the click handler to avoid popup block).
    window.open(whatsappLink(g), '_blank', 'noopener,noreferrer')
    if (!secret) return

    // Optimistically mark sent.
    const stamp = new Date().toISOString()
    setGuests((gs) => gs.map((x) => (x.guest_id === g.guest_id ? { ...x, sent_at: stamp } : x)))
    try {
      await markGuestSent(secret, g.guest_id)
    } catch {
      // Revert on failure.
      setGuests((gs) =>
        gs.map((x) => (x.guest_id === g.guest_id ? { ...x, sent_at: g.sent_at } : x))
      )
      setActionError(`Couldn't record the sent stamp for ${g.name}. The message still opened.`)
    }
  }

  const stats = useMemo(() => {
    let responded = 0
    let attendingHeadcount = 0
    let kids = 0
    for (const g of guests) {
      if (g.rsvp_status === 'Yes' || g.rsvp_status === 'No') responded++
      if (g.rsvp_status === 'Yes') {
        attendingHeadcount += g.headcount || 0
        kids += g.kids || 0
      }
    }
    return {
      invited: guests.length,
      responded,
      pending: guests.length - responded,
      attendingHeadcount,
      kids,
    }
  }, [guests])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guests.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && statusOf(g) !== statusFilter) return false
      if (notSentOnly && g.sent_at) return false
      return true
    })
  }, [guests, search, statusFilter, notSentOnly])

  // ---- Passcode gate ----
  if (!secret) {
    return (
      <main className="page gate">
        <h1 className="hero__names gate__title">Admin</h1>
        <form className="gate__form" onSubmit={authenticate}>
          <label className="visually-hidden" htmlFor="admin-passcode">
            Admin passcode
          </label>
          <input
            id="admin-passcode"
            type="password"
            className="gate__input"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={authBusy}>
            {authBusy ? 'Checking…' : 'Enter'}
          </button>
          {authError && (
            <p className="form-error" role="alert">
              {authError}
            </p>
          )}
        </form>
      </main>
    )
  }

  // ---- Console ----
  return (
    <main className="admin">
      <div className="admin__wrap">
        <header className="admin__head">
          <h1 className="admin__title">Guest list</h1>
        </header>

        <section className="stats" aria-label="Summary">
          <Stat label="Invited" value={stats.invited} />
          <Stat label="Responded" value={stats.responded} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Attending" value={stats.attendingHeadcount} />
          <Stat label="Kids" value={stats.kids} />
        </section>

        <section className="controls" aria-label="Filters">
          <input
            type="search"
            className="controls__search"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="controls__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="Yes">Attending</option>
            <option value="No">Declined</option>
            <option value="pending">Pending</option>
          </select>
          <label className="controls__check">
            <input
              type="checkbox"
              checked={notSentOnly}
              onChange={(e) => setNotSentOnly(e.target.checked)}
            />
            Not yet sent
          </label>
        </section>

        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}

        <div className="guests">
          <div className="guests__head" aria-hidden="true">
            <span>Name</span>
            <span>Phone</span>
            <span>Status</span>
            <span>Party</span>
            <span>Kids</span>
            <span>Sent</span>
            <span></span>
          </div>

          {filtered.length === 0 ? (
            <p className="guests__empty">No guests match these filters.</p>
          ) : (
            filtered.map((g) => {
              const status = statusOf(g)
              return (
                <div className="guest" key={g.guest_id}>
                  <div className="guest__name" data-label="Name">
                    {g.name}
                  </div>
                  <div data-label="Phone">{g.phone || '—'}</div>
                  <div data-label="Status">
                    <span className={`badge badge--${status}`}>
                      {status === 'pending' ? 'Pending' : status === 'Yes' ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div data-label="Party">{g.headcount || 0}</div>
                  <div data-label="Kids">{g.kids || 0}</div>
                  <div data-label="Sent">
                    {g.sent_at ? <span className="sent-yes">✓ Sent</span> : '—'}
                  </div>
                  <div className="guest__action">
                    <button type="button" className="btn btn--ghost wa-btn" onClick={() => handleSend(g)}>
                      WhatsApp
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label label">{label}</span>
    </div>
  )
}
