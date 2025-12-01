// Moved to trash on 2025-11-26: unused UI logging wrappers.
/**
 * Event Handler Wrappers for UI Interaction Logging - Super DRY
 */

import type React from 'react'

import { createLoggedHandler } from './handlers-base.js'

export function loggedClick(handler: (event?: React.MouseEvent) => void | Promise<void>, label: string, additionalData?: Record<string, unknown>): (event: React.MouseEvent) => void {
  return createLoggedHandler(handler, 'ui', 'click', () => ({ button: label, ...additionalData }))
}

export function loggedChange<T>(handler: (value: T, event?: React.ChangeEvent) => void | Promise<void>, field: string, additionalData?: Record<string, unknown>): (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void {
  return createLoggedHandler((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value as T
    return handler(value, event)
  }, 'ui', 'change', (event) => ({
    field,
    value: typeof event.target.value === 'string' && event.target.value.length > 50 ? `${event.target.value.slice(0, 50)}...` : event.target.value,
    ...additionalData,
  }))
}

export function loggedToggle(handler: (checked: boolean, event?: React.ChangeEvent) => void | Promise<void>, setting: string, additionalData?: Record<string, unknown>): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return createLoggedHandler((event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    return handler(checked, event)
  }, 'ui', 'toggle', (event) => ({ setting, value: event.target.checked, ...additionalData }))
}

export function loggedSubmit(handler: (event: React.FormEvent) => void | Promise<void>, formName: string, additionalData?: Record<string, unknown>): (event: React.FormEvent) => void {
  return createLoggedHandler(handler, 'ui', 'submit', () => ({ form: formName, ...additionalData }))
}

export function loggedTabChange(handler: (tabName: string) => void | Promise<void>, tabName: string, additionalData?: Record<string, unknown>): () => void {
  return createLoggedHandler(() => handler(tabName), 'ui', 'tab change', () => ({ tab: tabName, ...additionalData }))
}

export function loggedAction(action: string, additionalData?: Record<string, unknown>): () => void {
  return createLoggedHandler(() => {}, 'ui', action, () => additionalData || {})
}
