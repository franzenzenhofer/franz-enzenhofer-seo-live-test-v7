import { toHtml } from '@/cli/report'
import { useCopyFeedback } from '@/components/result/useCopyFeedback'
import type { Result } from '@/shared/results'

const fallbackDownload = (name: string, data: string, type: string) => {
  const blob = new Blob([data], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 0)
}

const ExportButton = ({ label, text, mime }: { label: 'JSON' | 'HTML'; text: string; mime: string }) => {
  const { copied, copy } = useCopyFeedback()
  const exportText = async () => {
    if (!await copy(text)) fallbackDownload(`live-test.${label.toLowerCase()}`, text, mime)
  }
  return <button type="button" aria-live="polite" className={`border px-2 py-1 text-xs rounded transition-colors ${copied ? 'border-green-600 bg-green-50 text-green-800' : 'hover:bg-gray-50'}`} onClick={exportText}>
    {copied ? `✓ ${label} copied` : `Copy ${label}`}
  </button>
}

export const ReportExportButtons = ({ url, results }: { url: string; results: Result[] }) => {
  return (
    <div className="flex gap-2">
      <ExportButton label="JSON" text={JSON.stringify(results, null, 2)} mime="application/json" />
      <ExportButton label="HTML" text={toHtml(url, results)} mime="text/html" />
    </div>
  )
}
