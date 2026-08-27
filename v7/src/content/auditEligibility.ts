export const isAuditEligible = async (): Promise<boolean> => {
  try {
    const reply = await chrome.runtime.sendMessage({ type: 'audit:eligibility' }) as { allowed?: boolean } | undefined
    return reply?.allowed === true
  } catch {
    return false
  }
}
