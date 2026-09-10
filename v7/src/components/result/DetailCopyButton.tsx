import { useCopyFeedback } from './useCopyFeedback'

export const DetailCopyButton = ({ value, children }: { value: string; children: string }) => {
  const { copied, copy } = useCopyFeedback()
  return <button type="button" onClick={() => void copy(value)} className="rounded border border-slate-300 bg-white px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
    {copied ? 'Copied' : children}
  </button>
}
