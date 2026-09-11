export const hasHeaders = (headers: Record<string, string> | undefined): boolean =>
  !!headers && Object.keys(headers).length > 0

// Abort an unread response body so the browser stops downloading it. fetch()
// resolves at headers; without this the full payload still crosses the wire.
export const discardBody = (res: Response): void => {
  res.body?.cancel().catch(() => {})
}
