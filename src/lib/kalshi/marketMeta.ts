export function formatToEastern(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

export function formatFp(value: string | undefined): string {
  if (value == null || value === '') return '—'
  return value
}
