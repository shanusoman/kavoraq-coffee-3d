import { useLayoutEffect, useRef } from 'react'
import { GALLERY } from '../data/gallery'
import { gsap } from '../lib/smoothScroll'
import CoffeeArt from './CoffeeArt'

export default function Gallery() {
  const root = useRef()
  const track = useRef()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(min-width: 900px)', () => {
        const distance = () => track.current.scrollWidth - window.innerWidth
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        gsap.utils.toArray('.shot').forEach((el) => {
          const frame = el.querySelector('.shot__frame')
          const inner = el.querySelector('.shot__inner')
          gsap.fromTo(frame, { clipPath: 'inset(18% 0% 18% 0%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
            scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 100%', end: 'left 45%', scrub: true },
          })
          gsap.fromTo(inner, { xPercent: -12, scale: 1.25 }, {
            xPercent: 12, scale: 1.08, ease: 'none',
            scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 100%', end: 'right 0%', scrub: true },
          })
        })
      })
      mm.add('(max-width: 899px)', () => {
        gsap.utils.toArray('.shot').forEach((el) => {
          gsap.fromTo(el.querySelector('.shot__frame'), { clipPath: 'inset(12% 6% 12% 6%)' }, {
            clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 40%', scrub: true },
          })
          gsap.fromTo(el.querySelector('.shot__inner'), { yPercent: -8, scale: 1.2 }, {
            yPercent: 8, scale: 1.05, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        })
      })
    }, root)
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section id="gallery" className="gallery" ref={root}>
      <div className="gallery__track" ref={track}>
        <div className="gallery__intro">
          <p className="eyebrow">Field Notes</p>
          <h2 className="display">Moments<br /><em>along the way.</em></h2>
          <p className="lede">From a hillside in Chikmagalur to the cup in your hands — the people, places and patience behind every bag.</p>
        </div>
        {GALLERY.map((g, i) => (
          <figure key={g.id} className={`shot shot--${i % 3}`}>
            <div className="shot__frame">
              <div className="shot__inner">
                {g.image ? <img src={g.image} alt={g.title} loading="lazy" /> : <CoffeeArt kind={g.kind} />}
              </div>
            </div>
            <figcaption>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <strong>{g.title}</strong>
              <em>{g.caption}</em>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
