const key = 'seo-result-template-settings'
const initial = () => {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
}
const saved = initial()
export const favorites = new Set(saved.favorites || [])
export const disabled = new Set(saved.disabled || ['demo:disabled'])
export const toggleSetting = (collection, id) => {
  collection.has(id) ? collection.delete(id) : collection.add(id)
  try { localStorage.setItem(key, JSON.stringify({ favorites: [...favorites], disabled: [...disabled] })) } catch { /* In-memory state works when storage is unavailable. */ }
}
export const displayItem = item => item.status === 'disabled' && !disabled.has(item.id)
  ? { ...item, status: 'pending', values: [['Execution', 'Waiting for next run']], noMarkup: 'None — no run started' }
  : item
