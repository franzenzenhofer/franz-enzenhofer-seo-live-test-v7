import { useEffect, useState } from 'react'

import { getAutoClear, setAutoClear } from '@/shared/settings'

export const AutoClear = () => {
  const [auto, setAuto] = useState(true)
  useEffect(() => { getAutoClear().then(setAuto).catch(()=>{}) }, [])
  const toggle = async () => { const v = !auto; setAuto(v); await setAutoClear(v) }
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={auto} onChange={toggle} />
      Auto‑clear results on navigation
    </label>
  )
}

