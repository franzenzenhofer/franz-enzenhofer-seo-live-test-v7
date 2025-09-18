export const RestrictedBanner = ({ message }: { message?: string }) => (
  <div className="border border-amber-300 bg-amber-50 text-amber-900 text-sm p-2 rounded">
    Content scripts cannot run on this page. Try another tab or open the URL directly. {message ? `(${message})` : ''}
  </div>
)

