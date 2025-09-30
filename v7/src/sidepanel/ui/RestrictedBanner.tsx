import { getResultColor } from '@/shared/colors'

export const RestrictedBanner = ({ message }: { message?: string }) => {
  const color = getResultColor('warn')
  return (
    <div className={`${color.full} border text-sm p-2 rounded`}>
      Content scripts cannot run on this page. Try another tab or open the URL directly. {message ? `(${message})` : ''}
    </div>
  )
}

