import { interactiveLogin, revoke } from '@/shared/auth'
import { showToast } from '@/shared/components/Toast'

export const useAuthHandlers = () => {
  const signIn = async () => {
    try {
      const token = await interactiveLogin()
      if (token) showToast('Signed in to Google Search Console', 'success')
      else showToast('Google sign-in canceled', 'info')
    } catch {
      showToast('Google sign-in failed. Try again.', 'error')
    }
  }

  const signOut = async () => {
    try {
      await revoke()
      showToast('Disconnected Google account', 'info')
    } catch {
      showToast('Sign out failed. Try again.', 'error')
    }
  }

  return { signIn, signOut }
}
