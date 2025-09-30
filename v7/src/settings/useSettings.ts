import { useEffect, useState } from 'react'

import { TOKEN_KEY, getStoredToken } from '@/shared/auth'

type Flags = Record<string, boolean>

export const useSettings = () => {
  const [flags, setFlags] = useState<Flags>({})
  const [vars, setVars] = useState<Record<string, string>>({})
  const [hasToken, setHasToken] = useState(false)
  const [autoClear, setAutoClear] = useState(false)
  const [autoRun, setAutoRun] = useState(false)
  const [preserveLog, setPreserveLog] = useState(false)

  useEffect(() => {
    chrome.storage.local.get([
      'rule-flags',
      'globalRuleVariables',
      TOKEN_KEY,
      'ui:autoClear',
      'ui:autoRun',
      'ui:preserveLog'
    ], (items) => {
      setFlags(items['rule-flags'] || {})
      setVars(items['globalRuleVariables'] || {})
      setAutoClear(items['ui:autoClear'] !== false)
      setAutoRun(items['ui:autoRun'] !== false)
      setPreserveLog(items['ui:preserveLog'] === true)
    })

    getStoredToken().then((t) => setHasToken(!!t)).catch(() => {})
  }, [])

  return {
    flags, setFlags, vars, setVars,
    hasToken, setHasToken,
    autoClear, setAutoClear,
    autoRun, setAutoRun,
    preserveLog, setPreserveLog
  }
}