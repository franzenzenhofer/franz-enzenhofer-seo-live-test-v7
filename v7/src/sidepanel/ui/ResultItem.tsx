import { getResultColor } from '@/shared/colors'
import { getActiveTabId } from '@/shared/chrome'
import type { Result } from '@/shared/results'

export const ResultItem = ({ result, index }: { result: Result; index: number }) => {
  const color = getResultColor(result.type)

  const handleClick = async () => {
    const tabId = await getActiveTabId()
    if (tabId) {
      const url = chrome.runtime.getURL(`src/report.html?tabId=${tabId}&index=${index}`)
      chrome.tabs.create({ url })
    }
  }

  return (
    <div
      className={`${color.full} border rounded p-2 sm:p-3 cursor-pointer hover:opacity-90 transition-all`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 text-xs sm:text-sm opacity-75">
        <span className={`${color.dot} w-2 h-2 rounded-full`}></span>
        <span>{result.label}</span>
      </div>
      <div className="font-medium text-sm sm:text-base break-words mt-1">
        {result.message}
      </div>
    </div>
  )
}