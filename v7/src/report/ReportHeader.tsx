export const ReportHeader = ({ url, resultCount }: { url: string; resultCount: number }) => (
  <div className="report-header">
    <h1>Live Test Report</h1>
    <div className="flex items-center gap-4 mt-2">
      <span className="text-sm">{url}</span>
      <span className="dt-chip">{resultCount} results</span>
    </div>
  </div>
)