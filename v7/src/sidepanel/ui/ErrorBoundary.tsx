import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const stack = (info.componentStack || '').split('\n').slice(0, 6).join('\n')
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      chrome.runtime.sendMessage({
        channel: 'crash',
        context: 'sidepanel',
        kind: 'error',
        message: error.message,
        stack: `${error.stack?.split('\n').slice(0, 6).join('\n') || ''}\n${stack}`,
        at: Date.now(),
      }).catch(() => {})
    }
    console.warn('[ErrorBoundary]', error.message, stack)
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <div className="p-4 space-y-3 text-sm">
        <div className="font-semibold text-red-700">Side panel crashed</div>
        <div className="text-gray-700">{this.state.error.message}</div>
        <div className="text-xs text-gray-500">Check the Logs tab for details.</div>
        <button
          type="button"
          onClick={this.handleReset}
          className="border px-2 py-1 rounded hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    )
  }
}
