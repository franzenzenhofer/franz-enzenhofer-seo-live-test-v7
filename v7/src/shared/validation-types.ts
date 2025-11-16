export type ValidationResult = {
  valid: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}
