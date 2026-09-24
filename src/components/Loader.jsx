import { useEffect, useRef, useState } from 'react'
import { gsap, lockScroll } from '../lib/smoothScroll'
import { SITE } from '../data/site'

export default function Loader({ ready }) {
  const root = useRef()
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const state = useRef({ v: 0 })

  useEffect(() => {
    lockScroll(true)
    const t = gsap.to(state.current, { v: 86, duration: 2.4, ease: 'power2.out', onUpdate: () => setCount(Math.round(state.current.v)) })
    return () => t.kill()
  }, [])

  useEffect(() => {
    if (!ready || !root.current) return
    const tl = gsap.timeline({ delay: 0.2 })
    tl.to(state.current, { v: 100, duration: 0.6, ease: 'power2.inOut', onUpdate: () => setCount(Math.round(state.current.v)) })
      .to(root.current.querySelector('.loader__inner') ?? {}, { y: -40, opacity: 0, duration: 0.8, ease: 'expo.in' })
      .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
      .add(() => {
        lockScroll(false)
        setDone(true)
      })
    return () => tl.kill()
  }, [ready])

  if (done) return null
  return (
    <div className="loader" ref={root} role="status" aria-label="Loading">
      <div className="loader__inner">
        <span className="loader__mark">{SITE.brand}</span>
        <span className="loader__count">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  )
}
