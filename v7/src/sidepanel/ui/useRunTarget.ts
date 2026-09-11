import { useEffect, useState } from 'react'

/**
 * What Run test targets. The URL field is prefilled from the LAST run's URL,
 * which is stale after an in-page (pushState) navigation - so the run targets
 * the tab's current page (`runUrl` undefined) unless the user deliberately
 * edited the field. A run's loaded URL and a new run from storage both reset
 * the edit.
 */
export const useRunTarget = (lastRunUrl: string) => {
  const [editableUrl, setEditableUrl] = useState(lastRunUrl || '')
  const [edited, setEdited] = useState(false)

  useEffect(() => {
    setEditableUrl(lastRunUrl || '')
    setEdited(false)
  }, [lastRunUrl])

  const onUrlChange = (next: string) => {
    setEditableUrl(next)
    setEdited(true)
  }
  const onUrlLoaded = (loaded: string) => {
    setEditableUrl(loaded)
    setEdited(false)
  }
  return { editableUrl, runUrl: edited ? editableUrl : undefined, onUrlChange, onUrlLoaded }
}
