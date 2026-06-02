import { acquireKalshiRateLimit } from './rateLimit'

/** Same-origin proxy in dev (Vite) and production (Vercel rewrites). */
export const KALSHI_API_BASE = '/kalshi-api/trade-api/v2'

export async function kalshiGet<T>(path: string): Promise<T> {
  await acquireKalshiRateLimit()

  const response = await fetch(`${KALSHI_API_BASE}${path}`)

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { error?: { message?: string } }
      if (body.error?.message) detail = body.error.message
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`Kalshi API error: ${detail}`)
  }

  return response.json() as Promise<T>
}
