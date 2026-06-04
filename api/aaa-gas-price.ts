import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolveSiteOrigin, scrapeAaaGasPrice } from '../lib/aaa/scrapeGasPrice'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  try {
    const siteOrigin = resolveSiteOrigin(
      request.headers.referer,
      request.headers['x-forwarded-host'] ?? request.headers.host,
      request.headers['x-forwarded-proto'],
      request.headers['x-site-origin'],
    )
    const price = await scrapeAaaGasPrice(siteOrigin)
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    response.status(200).json({ price })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to scrape AAA gas price'
    response.status(500).json({ error: message })
  }
}
