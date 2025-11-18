import { AuthLogsViewer } from './AuthLogsViewer'

export const GoogleAccount = ({
  hasToken, signIn, signOut
}: {
  hasToken: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}) => {
  const manifest = chrome.runtime.getManifest()
  const clientId = manifest.oauth2?.client_id || 'Not configured'
  const extensionId = chrome.runtime.id

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Google Account</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Authentication Status
            </h3>
            <p className="text-xs text-gray-600">
              {hasToken
                ? '✓ Signed in to Google Search Console'
                : '⚠️ Not signed in - GSC rules disabled'}
            </p>
          </div>
          <div className="ml-4 flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={signIn}
              disabled={hasToken}
            >
              Sign In
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              onClick={signOut}
            >
              Clear Token
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">
            OAuth Configuration
          </h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex gap-2">
              <span className="text-gray-500">Client ID:</span>
              <span className="text-gray-900 break-all">{clientId}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500">Extension ID:</span>
              <span className="text-gray-900">{extensionId}</span>
            </div>
          </div>
        </div>

        <AuthLogsViewer />
      </div>
    </div>
  )
}