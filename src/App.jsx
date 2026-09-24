import { useCallback, useEffect, useMemo, useState } from 'react'
import { initSmoothScroll, ScrollTrigger } from './lib/smoothScroll'
import Nav from './components/Nav'
import Story from './components/Story'
import Collection from './components/Collection'
import Gallery from './components/Gallery'
import Menu from './components/Menu'
import Visit from './components/Visit'
import Footer from './components/Footer'
import Loader from './components/Loader'

function detectQuality() {
  const small = window.matchMedia('(max-width: 768px)').matches
  const weak = (navigator.hardwareConcurrency || 8) <= 4
  return small || weak ? 0.55 : 1
}

export default function App() {
  const quality = useMemo(detectQuality, [])
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  useEffect(() => initSmoothScroll(), [])
  useEffect(() => {
    // Safety net: never trap the user behind the loader.
    const t = setTimeout(() => setReady(true), 9000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (!ready) return
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [ready])

  return (
    <>
      <Loader ready={ready} />
      <Nav />
      <main>
        <Story quality={quality} onReady={onReady} />
        <Collection />
        <Gallery />
        <Menu />
        <Visit />
      </main>
      <Footer />
    </>
  )
}
