// src/pages/Home.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getDailyProgress } from '../api/api'  // ДОБАВИЛ getDailyProgress
import { useTranslation } from 'react-i18next'
import { calculateDailyGoal } from '../utils/dailyGoals'  // ДОБАВИЛ для расчета дневной цели

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

  const internalId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)

  // ДОБАВИЛ поля для дневной цели
  const examDate = useSession(state => state.examDate)
  const manualDailyGoal = useSession(state => state.manualDailyGoal)
  const dailyProgress = useSession(state => state.dailyProgress)
  const dailyProgressDate = useSession(state => state.dailyProgressDate)
  const setDailyProgress = useSession(state => state.setDailyProgress)

  const navigate = useNavigate()

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user
    setUserName(user?.first_name || 'друг')
  }, [])

  useEffect(() => {
    if (!internalId) return

    // ИЗМЕНИЛ: загружаем статистику И daily progress параллельно
    Promise.all([
      getUserStats(internalId),
      getDailyProgress(internalId)
    ])
    .then(([statsRes, progressRes]) => {
      setStats(statsRes.data)
      setDailyProgress(progressRes.data.questions_mastered_today, progressRes.data.date)
    })
    .catch(err => console.error('Ошибка получения данных', err))
  }, [internalId, examCountry, examLanguage, setDailyProgress])

  const handleStart = () => {
    navigate('/mode')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  // ДОБАВИЛ расчет дневной цели
  const dailyGoalData = stats ? calculateDailyGoal(
    examDate,
    stats.total_questions,
    stats.correct
  ) : null

  const finalDailyGoal = manualDailyGoal || dailyGoalData?.dailyGoal || 30
  const todayQuestionsMastered = dailyProgress || 0
  const goalProgress = finalDailyGoal > 0 ? Math.min((todayQuestionsMastered / finalDailyGoal) * 100, 100) : 0

  // Проверяем актуальность кэшированных данных
  const today = new Date().toISOString().split('T')[0]
  const isProgressCurrent = dailyProgressDate === today

  // размеры и отступы для прогресс-бара
  const size = 150
  const strokeWidth = 12

  return (
    <div style={{ padding: 20 }}>
      <h2>{t('home.greeting', { name: userName })}</h2>

      {/* ДОБАВИЛ секцию дневного прогресса */}
      {isProgressCurrent && (
        <div style={{ 
          marginBottom: 20, 
          padding: 16, 
          backgroundColor: '#f5f5f5', 
          borderRadius: 8 
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>
            {t('home.dailyProgress')}
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                {todayQuestionsMastered} / {finalDailyGoal}
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                {t('home.questionsMasteredToday')}
              </div>
            </div>
            
            {/* Мини прогресс-кольцо */}
            <div style={{ width: 50, height: 50 }}>
              <CircularProgressbar
                value={goalProgress}
                maxValue={100}
                strokeWidth={15}
                styles={buildStyles({
                  pathColor: goalProgress >= 100 ? '#4CAF50' : '#FFA500',
                  trailColor: '#e0e0e0',
                  strokeLinecap: 'round'
                })}
              />
            </div>
          </div>
        </div>
      )}

      {/* СУЩЕСТВУЮЩАЯ секция статистики БЕЗ ИЗМЕНЕНИЙ */}
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

      {/* СУЩЕСТВУЮЩИЕ кнопки БЕЗ ИЗМЕНЕНИЙ */}
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