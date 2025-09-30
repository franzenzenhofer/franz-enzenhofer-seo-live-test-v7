export const LogsHeader = ({ tabId, logsCount }: { tabId: number; logsCount: number }) => {
  const version = chrome.runtime.getManifest().version

  return (
    <div className="border-b pb-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        Live Test Logs
        <span className="text-sm text-gray-500">v{version}</span>
      </h1>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm text-gray-600">Tab ID: {tabId}</span>
        <span className="text-sm text-gray-600">{logsCount} entries</span>
      </div>
    </div>
  )
}