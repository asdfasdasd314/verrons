/** Kalshi: at most 10 API requests per 1-second window. */
const MAX_REQUESTS_PER_SECOND = 3 // 3 is the max we can do for candles

let windowStartMs: number | null = null
let requestsInWindow = 0

/** Serializes rate-limit checks so concurrent callers queue in order. */
let gate = Promise.resolve()

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Waits if needed before sending a request. After 10 requests within the
 * current second (since the first in that window), blocks until one second
 * has elapsed since that first request, then starts a new window.
 */
export async function acquireKalshiRateLimit(): Promise<void> {
  const previous = gate
  let release!: () => void
  gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous

  try {
    const now = Date.now()

    if (windowStartMs === null || now - windowStartMs >= 1000) {
      windowStartMs = now
      requestsInWindow = 0
    }

    if (requestsInWindow >= MAX_REQUESTS_PER_SECOND) {
      const waitMs = 1000 - (now - windowStartMs)
      if (waitMs > 0) {
        await delay(waitMs)
      }
      windowStartMs = Date.now()
      requestsInWindow = 0
    }

    requestsInWindow += 1
  } finally {
    release()
  }
}
