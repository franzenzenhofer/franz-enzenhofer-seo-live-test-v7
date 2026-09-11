import { useEffect, useState } from 'react'

/**
 * What Run test targets. The URL field shows the page the tab is on
 * (`pageUrl`; the last run's URL until the tab is known), and the run targets
 * the tab's current page (`runUrl` undefined) unless the user deliberately
 * edited the field. A change of the tab's URL, a new run from storage and a
 * run's loaded URL all reset the edit.
 */
export const useRunTarget = (pageUrl: string, lastRunUrl = pageUrl) => {
  const [editableUrl, setEditableUrl] = useState(pageUrl || '')
  const [edited, setEdited] = useState(false)

  useEffect(() => {
    setEditableUrl(pageUrl || '')
    setEdited(false)
  }, [pageUrl, lastRunUrl])

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
