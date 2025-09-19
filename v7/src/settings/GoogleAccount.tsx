export const GoogleAccount = ({
  hasToken, signIn, signOut
}: {
  hasToken: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}) => (
  <div className="settings-section">
    <h2>Google Account</h2>
    <div className="setting-row">
      <div className="setting-label">
        <h3>Authentication Status</h3>
        <p>{hasToken ? 'Signed in to Google' : 'Not signed in'}</p>
      </div>
      <div className="setting-control">
        {!hasToken ? (
          <button className="dt-button primary" onClick={signIn}>
            Sign In
          </button>
        ) : (
          <button className="dt-button" onClick={signOut}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  </div>
)