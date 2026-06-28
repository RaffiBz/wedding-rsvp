import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Hero from '../components/Hero'
import RsvpForm, { type RsvpFormSubmit } from '../components/RsvpForm'
import InvalidInvite from '../components/InvalidInvite'
import SubmitSuccess from '../components/SubmitSuccess'
import { ApiError, resolveRsvp, submitRsvp } from '../lib/api'
import type { Attending, ResolveResult, SubmitPayload } from '../types'
import './invite.css'

// Soft RSVP deadline — never blocks; just shows a gentle nudge afterwards.
const DEADLINE = new Date('2026-07-15T23:59:59')

type Phase = 'loading' | 'ready' | 'invalid' | 'error'

interface SubmittedState {
  attending: Attending
  edited: boolean
}

function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isValidation)
      return "We couldn't save your RSVP — please double-check the names and try again."
    if (err.isNetwork) return err.message
    if (err.isNotFound) return 'This invite link is no longer valid.'
  }
  return 'Something went wrong. Please try again in a moment.'
}

export default function Invite() {
  const [params] = useSearchParams()
  const token = params.get('t')?.trim() || ''

  const formRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [data, setData] = useState<ResolveResult | null>(null)
  const [loadError, setLoadError] = useState('')
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Resolve the token on load (and on retry).
  useEffect(() => {
    if (!token) {
      setPhase('invalid')
      return
    }
    const ctrl = new AbortController()
    setPhase('loading')
    resolveRsvp(token, ctrl.signal)
      .then((res) => {
        setData(res)
        setPhase('ready')
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        if (err instanceof ApiError && err.isNotFound) {
          setPhase('invalid')
          return
        }
        setLoadError(
          err instanceof ApiError ? err.message : 'Something went wrong loading your invite.'
        )
        setPhase('error')
      })
    return () => ctrl.abort()
  }, [token, reloadKey])

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit(formData: RsvpFormSubmit) {
    const payload: SubmitPayload = {
      token,
      attending: formData.attending,
      turnstileToken: formData.turnstileToken,
      honeypot: formData.honeypot,
      env: 'prod',
      members: formData.members,
    }

    try {
      await submitRsvp(payload)
    } catch (err) {
      // Re-throw a friendly message; RsvpForm shows it inline and keeps state.
      throw new Error(friendlyError(err))
    }

    // Reflect the new response locally so "Change response" re-hydrates correctly.
    setData((prev) =>
      prev
        ? {
            ...prev,
            response: {
              attending: formData.attending,
              submitted_at: new Date().toISOString(),
              members: formData.members,
            },
          }
        : prev
    )
    setSubmitted({ attending: formData.attending, edited: !!data?.response })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (phase === 'invalid') return <InvalidInvite />

  if (phase === 'loading') {
    return (
      <main className="page loader">
        <span className="loader__dot" aria-hidden="true" />
        <p className="loader__text label">Opening your invitation…</p>
      </main>
    )
  }

  if (phase === 'error') {
    return (
      <main className="page invalid">
        <p className="hero__names invalid__title">Raffi &amp; Nver</p>
        <p className="invalid__msg">{loadError}</p>
        <button type="button" className="btn btn--ghost" onClick={() => setReloadKey((k) => k + 1)}>
          Try again
        </button>
      </main>
    )
  }

  // phase === 'ready' — data is guaranteed set
  const resolved = data as ResolveResult
  const pastDeadline = new Date() > DEADLINE

  return (
    <main className="invite">
      <Hero onScrollToForm={scrollToForm} />

      <section className="form-section" ref={formRef} id="rsvp-form">
        <div className="page">
          <header className="form-section__head">
            <h2 className="form-section__title">Kindly respond</h2>
            <p className="form-section__sub label">We hope you'll celebrate with us</p>
          </header>

          {!submitted && pastDeadline && (
            <p className="deadline-note" role="note">
              RSVPs were due July 15 — but please still let us know, we'd love to have you.
            </p>
          )}

          {submitted ? (
            <SubmitSuccess
              attending={submitted.attending}
              edited={submitted.edited}
              onChange={() => setSubmitted(null)}
            />
          ) : (
            <RsvpForm
              // Remount when the existing response changes so it re-hydrates.
              key={resolved.response?.submitted_at ?? 'new'}
              maxPartySize={resolved.max_party_size}
              existing={resolved.response}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </section>
    </main>
  )
}
