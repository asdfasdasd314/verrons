const AAA_GAS_URL = 'https://gasprices.aaa.com/'

const NUMB_PRICE_PATTERN = /class=["']numb["'][^>]*>\s*(\$[\d.]+)/i

export function parseAaaGasPriceFromHtml(html: string): string | null {
  const match = html.match(NUMB_PRICE_PATTERN)
  return match?.[1] ?? null
}

export function parseAaaGasPriceString(rawPrice: string): number {
  return Number.parseFloat(rawPrice.slice(1))
}

export async function scrapeAaaGasPrice(): Promise<string> {
  const response = await fetch(AAA_GAS_URL, {
    headers: {
      'User-Agent': 'Verrons/1.0 (+https://verrons.com)',
      Accept: 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`AAA fetch failed: ${response.status}`)
  }

  const html = await response.text()
  const price = parseAaaGasPriceFromHtml(html)
  if (!price) {
    throw new Error('Could not find .numb price on AAA page')
  }

  return price
}
