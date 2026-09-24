import { useLayoutEffect, useRef, useState } from 'react'
import { SITE } from '../data/site'
import { gsap } from '../lib/smoothScroll'

export default function Visit() {
  const root = useRef()
  const [sent, setSent] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.visit__big span > span', { yPercent: 110 }, {
        yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: '.visit__big', start: 'top 85%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="visit" className="visit section" ref={root}>
      <h2 className="visit__big">
        <span><span>Your ritual,</span></span>
        <span><span><em>refined.</em></span></span>
      </h2>
      <div className="visit__grid">
        <form
          className="visit__form"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <label htmlFor="email" className="eyebrow">The Roast Letter</label>
          <p>New lots, brew guides, and first access to limited releases. Once a month.</p>
          {sent ? (
            <p className="visit__thanks">Thank you — your first letter is on its way.</p>
          ) : (
            <div className="visit__field">
              <input id="email" type="email" required placeholder="you@example.com" autoComplete="email" />
              <button type="submit" className="btn btn--solid">Subscribe</button>
            </div>
          )}
        </form>
        <div className="visit__info">
          <p className="eyebrow">Visit the Roastery</p>
          <address>{SITE.visit.address.map((l) => <span key={l}>{l}</span>)}</address>
          <dl>
            {SITE.visit.hours.map(([d, h]) => (
              <div key={d}><dt>{d}</dt><dd>{h}</dd></div>
            ))}
          </dl>
          <a className="link-arrow" href={`mailto:${SITE.visit.email}`}>{SITE.visit.email}</a>
        </div>
      </div>
    </section>
  )
}
