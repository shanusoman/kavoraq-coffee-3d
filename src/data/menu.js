/**
 * Café menu. Prices are placeholders — edit here only; the UI reads from this file.
 */
export const MENU = [
  {
    category: 'Espresso Bar',
    items: [
      { name: 'Espresso', note: 'Double shot, Signature Blend', price: 180 },
      { name: 'Americano', note: 'Espresso, hot water', price: 200 },
      { name: 'Cortado', note: 'Equal parts espresso and milk', price: 220 },
      { name: 'Cappuccino', note: 'Dense microfoam, cocoa dust', price: 240 },
      { name: 'Latte', note: 'Silky milk, single origin shot', price: 260 },
    ],
  },
  {
    category: 'Slow Bar',
    items: [
      { name: 'Signature Brew', note: 'Hand-poured V60, rotating origin', price: 290, highlight: true },
      { name: 'Chemex for Two', note: 'Clean, bright, shared', price: 420 },
      { name: 'Cold Brew', note: '18-hour steep, over ice', price: 270 },
      { name: 'Espresso Tonic', note: 'Tonic, orange peel, espresso', price: 280 },
    ],
  },
]
