export const getAutoClear = async () => {
  const { 'ui:autoClear': v } = await chrome.storage.local.get('ui:autoClear')
  return v !== false
}

export const setAutoClear = async (value: boolean) => {
  await chrome.storage.local.set({ 'ui:autoClear': value })
}

