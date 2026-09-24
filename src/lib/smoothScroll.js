import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { progress, pointer } from './progress'
import { damp } from './timeline'

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis = null

export function initSmoothScroll() {
  if (!prefersReducedMotion) {
    lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
  }

  const tick = (time, deltaTime) => {
    const dt = deltaTime / 1000
    lenis?.raf(time * 1000)
    progress.tick(dt)
    pointer.sx = damp(pointer.sx, pointer.x, 3, dt)
    pointer.sy = damp(pointer.sy, pointer.y, 3, dt)
  }
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.8, ...opts })
  else {
    const y = typeof target === 'number' ? target : document.querySelector(target)?.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: y ?? 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }
}

export const lockScroll = (locked) => {
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.classList.toggle('is-locked', locked)
}

export { gsap, ScrollTrigger }
