import { Fraunces } from 'next/font/google'

/**
 * Marketing ceremony face ("Paper of Record" register). Mount
 * `displayFont.variable` on the page/shell root, then use the `font-serif`
 * utility (mapped to `--font-display` in globals.css). Reserved for marketing,
 * auth, and legal surfaces — never dense product data.
 */
export const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
})
