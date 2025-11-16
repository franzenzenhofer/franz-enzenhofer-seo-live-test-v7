export const resultColors = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800',
    full: 'bg-red-50 border-red-300 text-red-900'
  },
  warn: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    full: 'bg-amber-50 border-amber-300 text-amber-900'
  },
  ok: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800',
    full: 'bg-green-50 border-green-300 text-green-900'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    full: 'bg-blue-50 border-blue-300 text-blue-900'
  },
  runtime_error: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-900',
    dot: 'bg-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    full: 'bg-orange-50 border-orange-400 text-orange-900'
  },
  pending: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    full: 'bg-sky-50 border-sky-300 text-sky-700'
  },
  disabled: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600',
    full: 'bg-gray-50 border-gray-300 text-gray-500'
  },
}

export type ColorSet = typeof resultColors.error