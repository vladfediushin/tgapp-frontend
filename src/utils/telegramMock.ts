// Utility for mocking Telegram WebApp data during development
export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface TelegramWebApp {
  initDataUnsafe: {
    user?: TelegramUser
  }
  ready: () => void
  expand: () => void
}

// Mock Telegram WebApp for development
export const mockTelegramWebApp = (): TelegramWebApp => ({
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en',
      photo_url: '/speedometer.gif'
    }
  },
  ready: () => console.log('Mock Telegram WebApp ready'),
  expand: () => console.log('Mock Telegram WebApp expanded')
})

// Setup mock for development
export const setupTelegramMock = () => {
  if (!window.Telegram) {
    console.log('Setting up mock Telegram WebApp for development')
    window.Telegram = {
      WebApp: mockTelegramWebApp()
    }
  }
}

// Auto-setup in development mode
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  setupTelegramMock()
}
