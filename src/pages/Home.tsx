import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats } from '../api/api'

const Home = () => {
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const userId = useSession(state => state.userId)
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const user = tg?.initDataUnsafe?.user

    if (tg && user) {
      tg.ready()
      tg.expand()
      setUserName(user.first_name || 'друг')

      // Отправляем данные юзера на бэкенд
      fetch(`${import.meta.env.VITE_API_BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
        }),
      }).catch(err => {
        console.error('Ошибка при отправке Telegram-пользователя:', err)
      })
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