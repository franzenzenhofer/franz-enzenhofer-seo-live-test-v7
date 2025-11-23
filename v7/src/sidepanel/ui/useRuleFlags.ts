import { useEffect, useState } from 'react'

const FLAGS_KEY = 'rule-flags'
type Flags = Record<string, boolean>

export const useRuleFlags = () => {
  const [flags, setFlags] = useState<Flags>({})

  useEffect(() => {
    const load = async () => {
      const { [FLAGS_KEY]: stored } = await chrome.storage.local.get(FLAGS_KEY)
      setFlags((stored as Flags) || {})
    }
    void load()
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[FLAGS_KEY]) {
        setFlags((changes[FLAGS_KEY].newValue as Flags) || {})
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const setFlag = (ruleId: string, enabled: boolean) => {
    setFlags((prev) => {
      const next = { ...prev, [ruleId]: enabled }
      chrome.storage.local.set({ [FLAGS_KEY]: next }).catch(() => {})
      return next
    })
  }

  const toggleFlag = (ruleId: string) => {
    const current = flags[ruleId]
    setFlag(ruleId, current === false)
  }

  return { flags, setFlag, toggleFlag }
}
