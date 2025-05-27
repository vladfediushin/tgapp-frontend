import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats } from '../api/api'

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

const Home = () => {
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const userId = useSession(state => state.userId)
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const user = tg?.initDataUnsafe?.user

    logToVercel('[TG INIT] Telegram object: ' + (tg ? '✅ found' : '❌ not found'))
    logToVercel('[TG INIT] User object: ' + JSON.stringify(user))
    logToVercel('[TG INIT] VITE_API_BASE_URL: ' + import.meta.env.VITE_API_BASE_URL)

    if (tg && user) {
      tg.ready()
      tg.expand()
      setUserName(user.first_name || 'друг')

      const payload = {
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      }

      logToVercel('[TG INIT] Sending to backend: ' + JSON.stringify(payload))

      fetch(`${import.meta.env.VITE_API_BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async res => {
          const text = await res.text()
          logToVercel(`[TG INIT] Response ${res.status}: ${text}`)
        })
        .catch(err => {
          logToVercel('[TG INIT] Error: ' + err.message)
        })
    } else {
      logToVercel('[TG INIT] Telegram WebApp or user not available')
    }
  }, [])

  useEffect(() => {
    getUserStats(userId)
      .then(res => setStats(res.data))
      .catch(err => console.error('Ошибка получения статистики', err))
  }, [userId])

  const handleStart = () => {
    navigate('/mode')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Привет, {userName}!</h2>

      {stats ? (
        <p>
          Пройдено: {stats.answered} из {stats.total_questions}, верных: {stats.correct}
        </p>
      ) : (
        <p>Загрузка статистики...</p>
      )}

      <button
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          marginTop: '20px',
          fontSize: '16px',
          backgroundColor: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
        }}
        onClick={handleStart}
      >
        Начать повторение
      </button>

      <button
        style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          marginTop: '10px',
          fontSize: '14px',
          backgroundColor: '#ECECEC',
          border: '1px solid #CCC',
          borderRadius: '8px',
        }}
        onClick={handleProfile}
      >
        Личный кабинет
      </button>
    </div>
  )
}

export default Home