import { useMemo } from 'react'

import { rulesInventory } from '@/rules/inventory'
import { DEFAULT_FAVORITES, PINNED_RULE_STORAGE_KEY, toPinnedRecord } from '@/shared/favorites'
import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const FavoritesManagement = () => {
  const [pinned, setPinned] = useStorageSetting<Record<string, boolean>>(PINNED_RULE_STORAGE_KEY, {})

  const favoriteAll = async () => {
    const allPinned = toPinnedRecord(rulesInventory.map((rule) => rule.id))
    await setPinned(allPinned)
  }

  const resetFavorites = async () => {
    await setPinned(toPinnedRecord([...DEFAULT_FAVORITES]))
  }

  const favorites = useMemo(
    () => rulesInventory.filter((rule) => pinned[rule.id]),
    [pinned],
  )

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Favorites Management</h2>
      <p className="text-xs text-gray-600 mb-4">Manage your favorited rules</p>
      <div className="flex flex-wrap gap-2">
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
          Reset to defaults
        </button>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-700 mb-2">
          Favorites ({favorites.length || 0})
        </p>
        {favorites.length === 0 ? (
          <p className="text-xs text-gray-500">No favorite rules yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-700 border"
              >
                <span className="text-amber-500" aria-hidden="true">★</span>
                {rule.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
