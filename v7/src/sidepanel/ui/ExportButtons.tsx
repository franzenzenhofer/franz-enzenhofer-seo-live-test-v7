import { toHtml } from '@/cli/report'

export const ExportButtons = ({ rows }: { rows: Array<{label:string;message:string;type:string}> }) => {
  const download = (name: string, data: string, type: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click()
  }
  const exportJson = () => download('live-test.json', JSON.stringify(rows, null, 2), 'application/json')
  const exportHtml = () => download('live-test.html', toHtml(location.href, rows), 'text/html')
  return (
    <span className="ml-auto flex gap-2"><button className="border px-1" onClick={exportJson}>Export JSON</button><button className="border px-1" onClick={exportHtml}>Export HTML</button></span>
  )
}

