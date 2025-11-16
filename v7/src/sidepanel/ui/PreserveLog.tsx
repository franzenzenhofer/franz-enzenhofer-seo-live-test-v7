import { useStorageSetting } from '@/shared/hooks/useStorageSetting'

export const PreserveLog = () => {
  // ONE line replaces 5 lines of duplicate storage logic!
  // Real-time sync with settings page automatically
  const [preserveLog, setPreserveLog] = useStorageSetting('ui:preserveLog', false)

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={preserveLog}
        onChange={(e) => setPreserveLog(e.target.checked)}
      />
      Preserve logs
    </label>
  )
}

