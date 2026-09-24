import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../lib/smoothScroll'
import { progress } from '../lib/progress'
import { at, CHAPTERS } from '../lib/timeline'
import { STORY_SCROLL_VH } from '../data/story'
import { useProgressStyles } from '../lib/useProgressStyles'
import StageRail from './StageRail'
import CoffeeArt from './CoffeeArt'
import { SITE } from '../data/site'

const Experience = lazy(() => import('../scene/Experience'))

const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

export default function Story({ quality, onReady }) {
  const stageRef = useRef()
  const overlayRef = useRef()
  const barRef = useRef()
  const [active, setActive] = useState(true)

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: stageRef.current,
      start: 'top top',
      end: () => `+=${(window.innerHeight * STORY_SCROLL_VH) / 100}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress.target = self.progress
      },
    })
    progress.trigger = st
    return () => {
      st.kill()
      progress.trigger = null
    }
  }, [])

  // Only render WebGL while the story is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(stageRef.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => progress.subscribe((p) => barRef.current && (barRef.current.style.transform = `scaleX(${p})`)), [])
  useEffect(() => {
    if (!hasWebGL) onReady?.()
  }, [onReady])

  useProgressStyles(overlayRef)

  return (
    <section id="story" className="story" aria-label="The journey of a coffee bean">
      <div className="story__stage" ref={stageRef}>
        <div className="story__canvas" aria-hidden="true">
          {hasWebGL ? (
            <Suspense fallback={null}>
              <Experience active={active} quality={quality} onReady={onReady} />
            </Suspense>
          ) : (
            <div className="story__fallback"><CoffeeArt kind="cup" /></div>
          )}
        </div>

        <div className="story__overlay" ref={overlayRef}>
          <Hero />

          <p className="story__caption" data-from={at('open', 0.3)} data-to={at('emerge', 0.75)} data-fade="0.012">
            <span className="reveal" style={{ '--i': 0 }}>Sealed at the source.</span>
            <em className="reveal" style={{ '--i': 1 }}>Opened for you.</em>
          </p>

          {CHAPTERS.map((s) => (
            <Chapter key={s.id} stage={s} />
          ))}
        </div>

        <StageRail />
        <div className="story__progress" aria-hidden="true"><span ref={barRef} /></div>
      </div>
    </section>
  )
}

function Hero() {
  return (
    <header className="hero" data-from="-1" data-to={at('intro', 0.8)} data-fade="0.025">
      <p className="hero__eyebrow reveal" style={{ '--i': 0 }}>{SITE.brand} — {SITE.tagline}</p>
      <h1 className="hero__title">
        <span className="hero__line hero__line--a"><span>From Bean</span></span>
        <span className="hero__line hero__line--b"><span><em>to</em> Moment</span></span>
      </h1>
      <p className="hero__sub reveal" style={{ '--i': 2 }}>{SITE.heroTagline}</p>
      <div className="hero__cue reveal" style={{ '--i': 3 }}>
        <span>Scroll to discover</span>
        <i aria-hidden="true" />
      </div>
    </header>
  )
}

function Chapter({ stage }) {
  const c = stage.chapter
  const isLast = stage.id === 'cup'
  const from = isLast ? at('cup', 0.45) : at(stage.id, 0.1)
  const to = isLast ? 1.2 : at(stage.id, 0.9)
  return (
    <article className={`chapter chapter--${c.align}`} data-from={from} data-to={to} aria-label={`${c.index} ${c.label}`}>
      <p className="chapter__index reveal" style={{ '--i': 0 }}>
        <span>{c.index}</span>
        <i />
        {c.label}
      </p>
      <h2 className="chapter__title">
        <span className="mask"><span>{c.title}</span></span>
      </h2>
      <p className="chapter__body reveal" style={{ '--i': 2 }}>{c.body}</p>
      {c.facts && (
        <dl className="chapter__facts reveal" style={{ '--i': 3 }}>
          {c.facts.map((f) => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {c.cta && (
        <a className="btn btn--solid reveal" style={{ '--i': 3 }} href={c.cta.href}>
          {c.cta.label}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      )}
    </article>
  )
}

