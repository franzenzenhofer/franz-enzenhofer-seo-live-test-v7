import { useStorageSetting } from '@/shared/hooks/useStorageSetting'
import { sameDocumentUrl } from '@/shared/softNavigation'
import { STORAGE_KEYS } from '@/shared/storage-keys'

type Props = {
  /** URL the active tab is on now (null while unknown). */
  pageUrl: string | null
  /** URL of the run the panel shows (run meta). */
  runUrl: string
}

/** The run below is not this page's: the tab moved on (in-page navigation or a load without a run). */
export const isPageChanged = (pageUrl: string | null, runUrl: string): boolean =>
  !!pageUrl && !!runUrl && !sameDocumentUrl(pageUrl, runUrl)

export const PageChangedNotice = ({ pageUrl, runUrl }: Props) => {
  const [autoRun] = useStorageSetting<boolean>(STORAGE_KEYS.UI.AUTO_RUN, true)
  if (!isPageChanged(pageUrl, runUrl)) return null
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="page-changed"
      className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 space-y-0.5"
    >
      <p className="font-semibold">Page changed - the results below are not for this URL.</p>
      <p className="break-all">
        They belong to <span className="font-mono">{runUrl}</span>.{' '}
        {autoRun
          ? 'Auto-run is on: a new test starts once the page has settled.'
          : 'Auto-run is off: click Run test to test the current page.'}
      </p>
    </div>
  )
}
