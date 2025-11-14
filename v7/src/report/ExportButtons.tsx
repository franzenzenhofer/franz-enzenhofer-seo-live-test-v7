import { toHtml } from '@/cli/report'
import type { Result } from '@/shared/results'

const fallbackDownload = (name: string, data: string, type: string) => {
  const blob = new Blob([data], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 0)
}

export const ReportExportButtons = ({
  url,
  results,
}: {
  url: string
  results: Result[]
}) => {
  const copy = async (label: string, text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.warn(`[report] clipboard copy failed for ${label}`, err)
      fallbackDownload(`live-test.${type === 'application/json' ? 'json' : 'html'}`, text, type)
    }
  }

  const copyJson = () => copy('json', JSON.stringify(results, null, 2), 'application/json')
  const copyHtml = () => copy('html', toHtml(url, results), 'text/html')

  return (
    <div className="flex gap-2">
      <button className="border px-2 py-1 text-xs rounded" onClick={copyJson}>Copy JSON</button>
      <button className="border px-2 py-1 text-xs rounded" onClick={copyHtml}>Copy HTML</button>
    </div>
  )
}
