export const LogsHeader = ({ logsCount }: { tabId: number | null; logsCount: number }) => {
  const version = chrome.runtime.getManifest().version

  const openSettings = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="border-b pb-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        Live Test Logs
        <span className="text-sm text-gray-500">v{version}</span>
        <button
          onClick={openSettings}
          className="ml-auto text-gray-500 hover:text-gray-700 text-xl"
          title="Open Settings"
        >
          ⚙️
        </button>
      </h1>
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <span>All tabs (last 3000 entries)</span>
        <span>{logsCount} entries</span>
      </div>
    </div>
  )
}
