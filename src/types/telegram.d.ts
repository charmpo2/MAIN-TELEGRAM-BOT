interface TelegramWebApp {
  ready: () => void
  expand: () => void
  enableClosingConfirmation: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    query_id?: string
    auth_date?: number
    hash?: string
    start_param?: string
  }
  MainButton: {
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  BackButton: {
    onClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  HapticFeedback: {
    impactOccurred: (type: 'light' | 'medium' | 'heavy') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
  openLink: (url: string) => void
  showPopup: (params: { title?: string; message: string; buttons?: { id: string; text: string; type?: string }[] }, callback?: (id: string) => void) => void
  platform: string
  version: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
