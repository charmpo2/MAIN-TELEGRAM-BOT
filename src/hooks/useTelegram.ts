import { useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface WebAppInitData {
  user?: TelegramUser
  query_id?: string
  auth_date?: number
  hash?: string
  start_param?: string
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [initDataUnsafe, setInitDataUnsafe] = useState<WebAppInitData | null>(null)

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp
      setWebApp(app)
      app.ready()
      app.expand()
      app.enableClosingConfirmation()

      if (app.initDataUnsafe?.user) {
        setUser(app.initDataUnsafe.user)
      }
      setInitDataUnsafe(app.initDataUnsafe)

      app.setHeaderColor('#0d1b2a')
      app.setBackgroundColor('#0d1b2a')
    }
  }, [])

  const showMainButton = (text: string, callback: () => void) => {
    if (!webApp) return
    webApp.MainButton.setText(text)
    webApp.MainButton.onClick(callback)
    webApp.MainButton.show()
  }

  const hideMainButton = () => {
    if (!webApp) return
    webApp.MainButton.hide()
  }

  const showBackButton = (callback: () => void) => {
    if (!webApp) return
    webApp.BackButton.onClick(callback)
    webApp.BackButton.show()
  }

  const hideBackButton = () => {
    if (!webApp) return
    webApp.BackButton.hide()
  }

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (!webApp?.HapticFeedback) return
    if (type === 'light' || type === 'medium' || type === 'heavy') {
      webApp.HapticFeedback.impactOccurred(type)
    } else {
      webApp.HapticFeedback.notificationOccurred(type)
    }
  }

  return {
    webApp,
    user,
    initDataUnsafe,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    isInTelegram: !!webApp,
  }
}
