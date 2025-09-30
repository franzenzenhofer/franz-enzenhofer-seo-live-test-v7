import { getStoredToken, interactiveLogin, revoke } from '@/shared/auth'

export const useAuthHandlers = (setHasToken: (v: boolean) => void) => {
  const signIn = async () => {
    await interactiveLogin()
    setHasToken(!!(await getStoredToken()))
  }

  const signOut = async () => {
    await revoke()
    setHasToken(false)
  }

  return { signIn, signOut }
}