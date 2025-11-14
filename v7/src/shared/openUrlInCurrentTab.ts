export const openUrlInCurrentTab = async (url: string): Promise<void> => {
  if (!url) return
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      await chrome.tabs.update(tabs[0].id, { url })
    }
  } catch {
    /* ignore */
  }
}
