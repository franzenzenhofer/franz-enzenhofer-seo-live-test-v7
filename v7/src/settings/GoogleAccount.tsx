export const GoogleAccount = ({
  hasToken, signIn, signOut
}: {
  hasToken: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h2 className="text-lg font-semibold mb-4">Google Account</h2>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">Authentication Status</h3>
        <p className="text-xs text-gray-600">
          {hasToken ? '✓ Signed in to Google' : 'Not signed in'}
        </p>
      </div>
      <div className="ml-4">
        {!hasToken ? (
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            onClick={signIn}
          >
            Sign In
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            onClick={signOut}
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  </div>
)