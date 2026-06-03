import { scrapeAaaGasPrice } from '../src/lib/aaa/scrapeGasPrice'

export default async function handler(
  _request: Request,
): Promise<Response> {
  try {
    const price = await scrapeAaaGasPrice()
    return Response.json({ price })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape AAA gas price'
    return Response.json({ error: message }, { status: 500 })
  }
}
