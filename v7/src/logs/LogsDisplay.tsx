export const LogsDisplay = ({ logs }: { logs: string[] }) => (
  <div
    id="logs-container"
    className="font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 h-[600px] overflow-auto"
  >
    {logs.length === 0 ? (
      <div className="text-gray-500">
        No logs yet. Run tests to see logs appear here in real-time.
      </div>
    ) : (
      logs.map((log, i) => (
        <div key={i} className="hover:bg-gray-100 px-2 py-1 rounded">
          {log}
        </div>
      ))
    )}
  </div>
)