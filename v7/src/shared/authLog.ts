import { logSystem } from '@/shared/logs'

export const logAuthEvent = (message: string, data: Record<string, unknown> = {}) => {
  const payload = Object.entries(data).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')
  logSystem(`auth:${message}${payload ? ` ${payload}` : ''}`).catch(() => {})
}
