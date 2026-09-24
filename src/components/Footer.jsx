import { SITE } from '../data/site'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__mark">{SITE.brand}</div>
      <nav aria-label="Footer">
        {SITE.nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
      </nav>
      <p>© {new Date().getFullYear()} {SITE.brand} — {SITE.tagline}. Roasted in small batches.</p>
    </footer>
  )
}
