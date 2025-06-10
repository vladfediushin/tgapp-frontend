import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, UserOut } from '../api/api'

// 🔧 Утилита для логгирования на Vercel
function logToVercel(message: string) {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }).catch(err => {
    console.error('[LOG ERROR]', err)
  })
}

const Authorize: React.FC = () => {
  const setInternalId = useSession(state => state.setUserId)
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const user = tg?.initDataUnsafe?.user

    logToVercel('[AUTH] Telegram object: ' + (tg ? '✅ found' : '❌ not found'))
    logToVercel('[AUTH] User object: ' + JSON.stringify(user))
    logToVercel('[AUTH] VITE_API_BASE_URL: ' + import.meta.env.VITE_API_BASE_URL)

    if (tg && user) {
      tg.ready()
      tg.expand()

      // Создаем пользователя через API
      createUser({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      })
        .then(res => {
          const data: UserOut = res.data
          logToVercel(`[AUTH] createUser response id=${data.id}`)
          // Сохраняем внутренний UUID в сторадж
          setInternalId(data.id)
          // Перенаправляем на главную страницу
          navigate('/home')
        })
        .catch(err => {
          logToVercel('[AUTH] createUser error: ' + err.message)
          // В случае ошибки все равно перенаправляем (можно добавить обработку ошибок)
          navigate('/home')
        })
    } else {
      logToVercel('[AUTH] Telegram WebApp or user not available')
      // Если нет данных Telegram, все равно перенаправляем (можно добавить fallback-логику)
      navigate('/home')
    }
  }, [setInternalId, navigate])

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Авторизация...</h2>
      <p>Пожалуйста, подождите</p>
    </div>
  )
}

export default Authorize