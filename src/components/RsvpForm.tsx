import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Turnstile from './Turnstile'
import type { Attending, Member, RsvpResponse } from '../types'

interface Row extends Member {
  id: number
}

export interface RsvpFormSubmit {
  attending: Attending
  members: Member[]
  honeypot: string
  turnstileToken: string
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface RsvpFormProps {
  maxPartySize: number
  /** Existing RSVP to hydrate (edit mode). Null/undefined = fresh form. */
  existing?: RsvpResponse | null
  /**
   * Called with validated, trimmed data. Backend wiring happens in a later step;
   * until then Invite passes a stub. Return a Promise to drive the busy state.
   */
  onSubmit?: (data: RsvpFormSubmit) => void | Promise<void>
}

const norm = (s: string) => s.trim().toLowerCase()

function buildInitialRows(max: number, existing?: RsvpResponse | null): Row[] {
  if (existing && existing.members.length > 0) {
    return existing.members.slice(0, max).map((m, i) => ({ ...m, id: i }))
  }
  const count = Math.min(2, Math.max(1, max))
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    first_name: '',
    last_name: '',
    under_18: false,
  }))
}

export default function RsvpForm({ maxPartySize, existing, onSubmit }: RsvpFormProps) {
  const reduce = useReducedMotion()
  const isEdit = !!existing

  const [attending, setAttending] = useState<Attending>(existing?.attending ?? 'Yes')
  const [rows, setRows] = useState<Row[]>(() => buildInitialRows(maxPartySize, existing))
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [localDone, setLocalDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleExpire = useCallback(() => setTurnstileToken(''), [])

  const nextId = useRef(rows.length)

  const atCap = rows.length >= maxPartySize

  // Duplicate detection (warn, don't block): same first+last among filled rows.
  const dupWarning = useMemo(() => {
    const seen = new Set<string>()
    for (const r of rows) {
      if (!r.first_name.trim() || !r.last_name.trim()) continue
      const key = `${norm(r.first_name)}|${norm(r.last_name)}`
      if (seen.has(key)) return true
      seen.add(key)
    }
    return false
  }, [rows])

  function patchRow(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setLocalDone(false)
  }

  function addRow() {
    if (atCap) return
    setRows((rs) => [
      ...rs,
      { id: nextId.current++, first_name: '', last_name: '', under_18: false },
    ])
    setLocalDone(false)
  }

  function removeRow(id: number) {
    setRows((rs) => rs.filter((r) => r.id !== id))
    setLocalDone(false)
  }

  function validate(): { ok: true; members: Member[] } | { ok: false; message: string } {
    if (attending === 'No') return { ok: true, members: [] }

    const trimmed: Member[] = rows
      .map((r) => ({
        first_name: r.first_name.trim(),
        last_name: r.last_name.trim(),
        under_18: r.under_18,
      }))
      .filter((m) => m.first_name || m.last_name)

    if (trimmed.length === 0) {
      return { ok: false, message: 'Please add at least one guest with a first and last name.' }
    }
    const incomplete = trimmed.some((m) => !m.first_name || !m.last_name)
    if (incomplete) {
      return { ok: false, message: 'Each guest needs both a first and last name.' }
    }
    if (trimmed.length > maxPartySize) {
      return { ok: false, message: `Your invitation allows up to ${maxPartySize} guests.` }
    }
    return { ok: true, members: trimmed }
  }

  async function handleSubmit() {
    setError(null)
    // Honeypot: a real user never fills this. If it's set, silently drop the
    // submit (don't tip off the bot with an error).
    if (honeypot.trim() !== '') return

    const result = validate()
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (!turnstileToken) {
      setError('Please complete the verification below before submitting.')
      return
    }
    const data: RsvpFormSubmit = {
      attending,
      members: result.members,
      honeypot,
      turnstileToken,
    }

    if (onSubmit) {
      try {
        setBusy(true)
        await onSubmit(data)
        // Success path unmounts this form (parent swaps in the success view).
      } catch (err) {
        // Inline error; form state is preserved so they can fix and resend.
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        setBusy(false)
      }
    } else {
      // No backend yet (pre-wiring): confirm validation passed.
      setLocalDone(true)
    }
  }

  const submitLabel = isEdit ? 'Update RSVP' : attending === 'Yes' ? 'Send RSVP' : 'Send response'

  const rowMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, height: 0, marginBottom: 0 },
        animate: { opacity: 1, height: 'auto', marginBottom: 'var(--gap)' },
        exit: { opacity: 0, height: 0, marginBottom: 0 },
        transition: { duration: 0.3, ease: [0.2, 0.7, 0.2, 1] as const },
      }

  return (
    <div className="form-card">
      {isEdit && existing && (
        <p className="form-note">
          Last submitted:{' '}
          {new Date(existing.submitted_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      <fieldset className="toggle" aria-label="Will you attend?">
        <legend className="label toggle__legend">Will you join us?</legend>
        <div className="toggle__track" role="radiogroup">
          {(['Yes', 'No'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={attending === opt}
              className={`toggle__opt ${attending === opt ? 'is-active' : ''}`}
              onClick={() => {
                setAttending(opt)
                setError(null)
                setLocalDone(false)
              }}
            >
              {opt === 'Yes' ? 'Joyfully accept' : 'Regretfully decline'}
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {attending === 'Yes' && (
          <motion.div
            key="party"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
          >
            <div className="rows" role="group" aria-label="Your party">
              <AnimatePresence initial={false}>
                {rows.map((row, idx) => (
                  <motion.div key={row.id} className="row" layout={!reduce} {...rowMotion}>
                    <div className="row__fields">
                      <label className="field">
                        <span className="visually-hidden">First name</span>
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="First name"
                          value={row.first_name}
                          onChange={(e) => patchRow(row.id, { first_name: e.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span className="visually-hidden">Last name</span>
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Last name"
                          value={row.last_name}
                          onChange={(e) => patchRow(row.id, { last_name: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="row__end">
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={row.under_18}
                          onChange={(e) => patchRow(row.id, { under_18: e.target.checked })}
                        />
                        {/* Label is "Under 16"; backend field is still `under_18` (API contract). */}
                        <span>Under 16</span>
                      </label>

                      {idx > 0 && (
                        <button
                          type="button"
                          className="row__remove"
                          onClick={() => removeRow(row.id)}
                          aria-label={`Remove guest ${idx + 1}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="add-row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={addRow}
                disabled={atCap}
              >
                + Add person
              </button>
              {atCap && (
                <span className="hint">
                  Your invitation is for up to {maxPartySize}{' '}
                  {maxPartySize === 1 ? 'guest' : 'guests'}.
                </span>
              )}
            </div>

            {dupWarning && (
              <p className="hint hint--warn">
                Two guests have the same name — just checking that's intentional.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {attending === 'No' && (
        <p className="form-note form-note--soft">
          We're sorry you can't make it — sending your response will let us know.
        </p>
      )}

      {/* Honeypot: off-screen, hidden from AT and tab order. Bots fill it; humans don't. */}
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this field empty
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {TURNSTILE_SITE_KEY && (
        <div className="turnstile-wrap">
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={setTurnstileToken}
            onExpire={handleExpire}
          />
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {localDone && !onSubmit && (
        <p className="form-ok" role="status">
          ✓ Looks good — this would submit (backend not wired yet).
        </p>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block submit"
        onClick={handleSubmit}
        disabled={busy}
      >
        {busy ? 'Sending…' : submitLabel}
      </button>
    </div>
  )
}
