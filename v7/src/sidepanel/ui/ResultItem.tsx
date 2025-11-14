import { getResultColor } from '@/shared/colors'
import { getActiveTabId } from '@/shared/chrome'
import type { Result } from '@/shared/results'
import { formatRuleName } from '@/report/formatRuleName'

export const ResultItem = ({ result, index }: { result: Result; index: number }) => {
  const color = getResultColor(result.type)
  const ruleName = formatRuleName(result)

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
        <span className="font-semibold uppercase">{result.label}</span>
        {ruleName && (
          <span className="text-[11px] sm:text-xs opacity-80 truncate">
            {ruleName}
          </span>
        )}
        <button
          type="button"
          className="ml-auto text-xs px-2 py-0.5 border rounded bg-white/60 text-gray-700 hover:bg-white"
          title="Open details"
          onClick={(e) => { e.stopPropagation(); handleClick() }}
        >
          ⓘ
        </button>
      </div>
      <div className="font-medium text-sm sm:text-base break-words mt-1">
        {result.message}
      </div>
    </div>
  )
}
