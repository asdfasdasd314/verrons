export async function fetchTodayAaaGasPrice(): Promise<string> {
  const response = await fetch('/api/aaa-gas-price')
  if (!response.ok) {
    throw new Error(`AAA gas price API error: ${response.status}`)
  }

  const data = (await response.json()) as { price?: string; error?: string }
  if (!data.price) {
    throw new Error(data.error ?? 'AAA gas price missing from response')
  }

  return data.price
}
