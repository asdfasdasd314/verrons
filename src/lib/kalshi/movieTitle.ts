export function parseMovieTitle(fullTitle: string): string {
  const words = fullTitle.trim().split(/\s+/)
  if (words.length <= 3) {
    return fullTitle.trim()
  }
  return words.slice(0, -3).join(' ')
}
