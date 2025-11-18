import { STORAGE_KEYS } from '@/shared/storage-keys'
import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const useDebugFlag = () => useStorageSetting(STORAGE_KEYS.UI.DEBUG, true)
