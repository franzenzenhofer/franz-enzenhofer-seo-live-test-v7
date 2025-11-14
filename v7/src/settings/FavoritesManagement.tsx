import { rulesInventory } from '@/rules/inventory'

const PIN_KEY = 'ui:pinnedRules'

export const FavoritesManagement = () => {
  const favoriteAll = async () => {
    const allPinned: Record<string, boolean> = {}
    rulesInventory.forEach((rule) => {
      allPinned[rule.id] = true
    })
    await chrome.storage.local.set({ [PIN_KEY]: allPinned })
  }

  const resetFavorites = async () => {
    await chrome.storage.local.set({ [PIN_KEY]: {} })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Favorites Management</h2>
      <p className="text-xs text-gray-600 mb-4">Manage your favorited rules</p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          onClick={favoriteAll}
        >
          Favorite All
        </button>
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
          onClick={resetFavorites}
        >
          Reset Favorites
        </button>
      </div>
    </div>
  )
}
