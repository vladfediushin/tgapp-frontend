// src/pages/Home.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import {
  getUserStats,
  getDailyProgress,
  getUserByTelegramId,
  UserStats
} from '../api/api'
import { useTranslation } from 'react-i18next'
import { calculateDailyGoal } from '../utils/dailyGoals'
import { FaCog, FaUser, FaChartBar } from 'react-icons/fa'
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import i18n from 'i18next'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [userName, setUserName] = useState(null)
  const [stats, setStats] = useState(null)
  const [userLoaded, setUserLoaded] = useState(false) // <- флаг загрузки user

  const internalId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)
  const examDate = useSession(state => state.examDate)
  const manualDailyGoal = useSession(state => state.manualDailyGoal)
  const dailyProgress = useSession(state => state.dailyProgress)
  const dailyProgressDate = useSession(state => state.dailyProgressDate)

  const setDailyProgress = useSession(state => state.setDailyProgress)
  const setExamCountry = useSession(state => state.setExamCountry)
  const setExamLanguage = useSession(state => state.setExamLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)
  const setExamDate = useSession(state => state.setExamDate)
  const setManualDailyGoal = useSession(state => state.setManualDailyGoal)

  // Получаем имя пользователя и загружаем его настройки
  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    setUserName(tgUser?.first_name || 'друг')

    if (!tgUser?.id) return

    getUserByTelegramId(tgUser.id)
      .then(res => {
        const user = res.data

        if (user.exam_country) setExamCountry(user.exam_country)
        if (user.exam_language) setExamLanguage(user.exam_language)
        if (user.ui_language) {
          setUiLanguage(user.ui_language)
          i18n.changeLanguage(user.ui_language)
        }
        if (user.exam_date) setExamDate(user.exam_date)
        if (user.daily_goal !== undefined && user.daily_goal !== null)
          setManualDailyGoal(user.daily_goal)

        setUserLoaded(true) // отметим, что загрузили user и установили данные
      })
      .catch(err => {
        console.error('Ошибка при получении пользователя:', err)
        setUserLoaded(true) // чтобы не блокировать навсегда
      })
  }, [])

  // Загружаем статистику и дневной прогресс только после загрузки пользователя и когда есть нужные параметры
  useEffect(() => {
    if (!internalId) return
    if (!userLoaded) return
    if (!examCountry || !examLanguage) return

    Promise.all([
      getUserStats(internalId),
      getDailyProgress(internalId)
    ])
      .then(([statsRes, progressRes]) => {
        setStats(statsRes.data)
        setDailyProgress(progressRes.data.questions_mastered_today, progressRes.data.date)
      })
      .catch(err => console.error('Ошибка получения данных', err))
  }, [internalId, userLoaded, examCountry, examLanguage, setDailyProgress])

  const handleStart = () => {
    navigate('/mode')
  }

  const dailyGoalData = stats
    ? calculateDailyGoal(examDate, stats.total_questions, stats.correct)
    : null

  const finalDailyGoal = manualDailyGoal ?? dailyGoalData?.dailyGoal ?? null
  const todayQuestionsMastered = dailyProgress || 0
  const goalProgress = finalDailyGoal && finalDailyGoal > 0
    ? Math.min((todayQuestionsMastered / finalDailyGoal) * 100, 100)
    : 0

  const today = new Date().toISOString().split('T')[0]
  const isProgressCurrent = dailyProgressDate === today

  const size = 150
  const strokeWidth = 12

  return (
    <div style={{ padding: 20 }}>
      <h2>{t('home.greeting', { name: userName })}</h2>

      {isProgressCurrent && finalDailyGoal !== null && (
        <div style={{
          marginBottom: 20,
          padding: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 8
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>
            {t('home.todayProgress')}
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 70
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                {todayQuestionsMastered} / {finalDailyGoal}
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                {t('home.questionsMasteredToday')}
              </div>
            </div>
            <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center' }}>
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

      {stats ? (
        <>
          <p>
            {t('home.stats', {
              answered: stats.answered,
              total: stats.total_questions,
              correct: stats.correct
            })}
          </p>

          <div
            style={{
              width: size,
              height: size,
              margin: '20px auto',
              position: 'relative'
            }}
          >
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

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}>
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

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}>
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

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontWeight: 'bold',
              fontSize: size * 0.2
            }}>
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

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#6c757d'
          }}
          onClick={() => navigate('/settings')}
          title={t('home.settings')}
        >
          <FaCog size={20} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t('home.settings')}</span>
        </button>

        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#6c757d'
          }}
          onClick={() => navigate('/profile')}
          title={t('home.profile')}
        >
          <FaUser size={20} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t('home.profile')}</span>
        </button>

        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#6c757d'
          }}
          title={t('home.statistics')}
        >
          <FaChartBar size={20} />
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t('home.statistics')}</span>
        </button>
      </div>
    </div>
  )
}

export default Home
