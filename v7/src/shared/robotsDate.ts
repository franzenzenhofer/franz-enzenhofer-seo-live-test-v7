// Parses the date value of an unavailable_after directive. RFC 822/850 dates
// contain commas, so the longest comma-joined prefix that Date.parse accepts
// wins; an unparseable value keeps its text with a null timestamp.
export const parseDirectiveDate = (value: string): { date: string; timestamp: number | null } => {
  const parts = value.split(',')
  for (let end = parts.length; end > 0; end--) {
    const candidate = parts.slice(0, end).join(',').trim()
    const timestamp = Date.parse(candidate)
    if (!Number.isNaN(timestamp)) return { date: candidate, timestamp }
  }
  return { date: value.trim(), timestamp: null }
}
