import BirdGlass from './BirdGlass'

/** Shown when ?t= is missing or /rsvp-resolve returns 404. No form. */
export default function InvalidInvite() {
  return (
    <main className="page invalid">
      <BirdGlass className="bird-glass bird-glass--sm" />
      <p className="hero__names invalid__title">Raffi &amp; Nver</p>
      <p className="invalid__msg">
        This invite link isn't valid — please check with Raffi or Nver for your
        personal RSVP link.
      </p>
    </main>
  )
}
