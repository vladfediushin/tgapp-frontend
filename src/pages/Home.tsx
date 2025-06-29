// src/pages/Home.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats } from '../api/api'
import { useTranslation } from 'react-i18next'

// импортируем прогресс-бар
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)

  const internalId    = useSession(state => state.userId)
  const examCountry   = useSession(state => state.examCountry)
  const examLanguage  = useSession(state => state.examLanguage)

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
  }, [internalId, examCountry, examLanguage])

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
      <h2>{t('home.greeting', { name: userName })}</h2>

      {stats ? (
        <>
          {/* Строка с числами */}
          <p>
            {t('home.stats', {
              answered: stats.answered,
              total: stats.total_questions,
              correct: stats.correct
            })}
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
        <p>{t('home.loadingStats')}</p>
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
        {t('home.startRevision')}
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
        {t('home.profile')}
      </button>
    </div>
  )
}

export default Home
