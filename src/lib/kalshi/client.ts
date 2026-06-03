export const KALSHI_API_BASE = '/kalshi-api/trade-api/v2'

export async function kalshiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${KALSHI_API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Kalshi API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}
