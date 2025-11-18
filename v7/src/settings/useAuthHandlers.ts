import { interactiveLogin, revoke } from '@/shared/auth'
import { showToast } from '@/shared/components/Toast'

export const useAuthHandlers = () => {
  const signIn = async () => {
    try {
      const token = await interactiveLogin()
      if (token) {
        showToast('✓ Signed in to Google Search Console', 'success')
      } else {
        showToast('Sign-in was cancelled. Check extension console for OAuth errors.', 'info')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Google sign-in failed: ${msg}`, 'error')
    }
  }

  const signOut = async () => {
    try {
      await revoke()
      showToast('✓ Token cleared and Google account disconnected', 'info')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Token cleanup failed: ${msg}`, 'error')
    }
  }

  return { signIn, signOut }
}
