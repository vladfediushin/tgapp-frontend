// === Telegram SDK Types ===

export interface TelegramUser {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }
  
  export interface TelegramWebApp {
    initData: string
    initDataUnsafe: {
      user?: TelegramUser
      auth_date?: number
      hash?: string
    }
    ready(): void
    expand(): void
  }
  
  declare global {
    interface Window {
      Telegram?: {
        WebApp: TelegramWebApp
      }
    }
  }
  