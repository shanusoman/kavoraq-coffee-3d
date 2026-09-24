export const SITE = {
  brand: 'KAVORAQ Coffee',
  tagline: 'Coffee • Craft • Moment',
  heroTagline: 'A journey crafted into every cup.',
  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  nav: [
    { label: 'Journey', href: '#story' },
    { label: 'Coffee', href: '#collection' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Menu', href: '#menu' },
    { label: 'Visit', href: '#visit' },
  ],
  visit: {
    address: ['14 Lavelle Road', 'Bengaluru 560001'],
    hours: [
      ['Mon – Fri', '7:30 – 21:00'],
      ['Sat – Sun', '8:00 – 22:00'],
    ],
    email: 'hello@kavoraq.example',
  },
}

export const formatPrice = (value) =>
  `${SITE.currency.symbol}${value.toLocaleString(SITE.currency.locale)}`
