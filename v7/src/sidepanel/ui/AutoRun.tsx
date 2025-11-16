import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const AutoRun = () => {
  // ONE line replaces 5 lines of duplicate storage logic!
  // Real-time sync with settings page automatically
  const [autoRun, setAutoRun] = useStorageSetting('ui:autoRun', true)

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={autoRun}
        onChange={(e) => setAutoRun(e.target.checked)}
      />
      Auto‑run on navigation
    </label>
  )
}

