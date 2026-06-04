const AAA_GAS_URL = 'https://gasprices.aaa.com/'

const NUMB_PRICE_PATTERN = /class=["']numb["'][^>]*>\s*(\$[\d.]+)/i

const DEFAULT_SITE_ORIGIN = 'https://verrons.vercel.app'

export function resolveSiteOrigin(
  referer?: string | string[],
  host?: string | string[],
  forwardedProto?: string | string[],
  clientOrigin?: string | string[],
): string {
  const fromClient = Array.isArray(clientOrigin) ? clientOrigin[0] : clientOrigin
  if (fromClient?.startsWith('http')) {
    return fromClient
  }

  const refererValue = Array.isArray(referer) ? referer[0] : referer
  if (refererValue) {
    try {
      return new URL(refererValue).origin
    } catch {
      // fall through
    }
  }

  const hostValue = Array.isArray(host) ? host[0] : host
  if (hostValue) {
    const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
    const protocol = protoValue === 'http' ? 'http' : 'https'
    return `${protocol}://${hostValue}`
  }

  return DEFAULT_SITE_ORIGIN
}

export function buildAaaRequestHeaders(siteOrigin: string): Record<string, string> {
  return {
    Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${siteOrigin}/`,
    Origin: siteOrigin,
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  }
}

export function parseAaaGasPriceFromHtml(html: string): string | null {
  const match = html.match(NUMB_PRICE_PATTERN)
  return match?.[1] ?? null
}

export function parseAaaGasPriceString(rawPrice: string): number {
  return Number.parseFloat(rawPrice.slice(1))
}

export async function scrapeAaaGasPrice(
  siteOrigin: string = DEFAULT_SITE_ORIGIN,
): Promise<string> {
  const response = await fetch(AAA_GAS_URL, {
    headers: buildAaaRequestHeaders(siteOrigin),
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
