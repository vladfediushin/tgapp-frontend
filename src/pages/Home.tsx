// Home.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats } from '../api/api'

// импортируем прогресс-бар
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const Home: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const internalId = useSession(state => state.userId)
  const navigate = useNavigate()

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user
    setUserName(user?.first_name || 'друг')
  }, [])

  useEffect(() => {
    if (!internalId) return
    getUserStats(internalId)
      .then(res => setStats(res.data))
      .catch(err => console.error('Ошибка получения статистики', err))
  }, [internalId])

  const handleStart = () => {
    navigate('/mode')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  // размеры и отступы для прогресс-бара
  const size = 150
  const strokeWidth = 12

  return (
    <div style={{ padding: 20 }}>
      <h2>Привет, {userName}!</h2>

      {stats ? (
        <>
          {/* Строка с числами */}
          <p>
            Пройдено: {stats.answered} из {stats.total_questions}, верных:{' '}
            {stats.correct}
          </p>

          {/* Трёхслойный круговой прогресс-бар */}
          <div
            style={{
              width: size,
              height: size,
              margin: '20px auto',
              position: 'relative'
            }}
          >
            {/* 1. Фоновый серый круг = total */}
            <CircularProgressbar
              value={stats.total_questions}
              maxValue={stats.total_questions}
              strokeWidth={strokeWidth}
              styles={buildStyles({
                pathColor: '#e0e0e0',
                trailColor: 'transparent',
                strokeLinecap: 'butt'
              })}
            />

            {/* 2. Оранжевый сегмент = answered */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              <CircularProgressbar
                value={stats.answered}
                maxValue={stats.total_questions}
                strokeWidth={strokeWidth}
                styles={buildStyles({
                  pathColor: '#FFA500',
                  trailColor: 'transparent',
                  strokeLinecap: 'butt'
                })}
              />
            </div>

            {/* 3. Зелёный сегмент = correct */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              <CircularProgressbar
                value={stats.correct}
                maxValue={stats.total_questions}
                strokeWidth={strokeWidth}
                styles={buildStyles({
                  pathColor: '#4CAF50',
                  trailColor: 'transparent',
                  strokeLinecap: 'butt'
                })}
              />
            </div>

            {/* Номер в центре */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 'bold',
                fontSize: size * 0.2
              }}
            >
              {stats.total_questions > 0
              ? `${Math.round((stats.correct / stats.total_questions) * 100)}%`
              : '0%'}
            </div>
          </div>
        </>
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
          borderRadius: '8px'
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
          borderRadius: '8px'
        }}
        onClick={handleProfile}
      >
        Личный кабинет
      </button>
    </div>
  )
}

export default Home