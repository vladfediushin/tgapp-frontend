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
import { Home as HomeIcon, User, BarChart3, Settings, Play, Flame, Calendar, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import i18n from 'i18next'
import LoadingSpinner from '../components/LoadingSpinner'
import BottomNavigation from '../components/BottomNavigation'

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

  const handleNewQuestions = () => {
    const params = new URLSearchParams({
      mode: 'new_only',
      batchSize: '30',
    })
    navigate(`/repeat?${params.toString()}`)
  }

  const handleIncorrectQuestions = () => {
    const params = new URLSearchParams({
      mode: 'incorrect',
      batchSize: '30',
    })
    navigate(`/repeat?${params.toString()}`)
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
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        paddingBottom: '80px' 
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '16px 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                margin: 0
              }}>
                {userName ? t('home.greeting', { name: userName }) : 'Привет, друг!'}
              </h1>
              <p style={{
                color: '#6b7280',
                margin: '4px 0 0 0',
                fontSize: '14px'
              }}>
                {userLoaded ? 'Продолжаем подготовку к экзамену' : 'Загружаем ваши данные...'}
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>
              👨‍💼
            </div>
          </div>
        </div>

      <div style={{ padding: '24px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Progress Card - всегда показываем, но с плейсхолдерами */}
        <div style={{
          background: isProgressCurrent && finalDailyGoal !== null 
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          opacity: (!userLoaded || (!examCountry || !examLanguage)) ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                {!userLoaded ? 'Загрузка...' : 
                 (!examCountry || !examLanguage) ? 'Настройте экзамен' :
                 isProgressCurrent && finalDailyGoal !== null ? t('home.todayProgress') : 'Дневная цель не установлена'}
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '4px 0 0 0',
                fontSize: '14px'
              }}>
                {!userLoaded ? 'Подготавливаем данные...' :
                 (!examCountry || !examLanguage) ? 'Перейдите в настройки' :
                 isProgressCurrent && finalDailyGoal !== null ? 'Отлично продвигаешься!' : 'Установите дату экзамена'}
              </p>
            </div>
            <div style={{
              width: '80px',
              height: '80px',
              position: 'relative'
            }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={
                    !userLoaded || (!examCountry || !examLanguage) ? "0 188.5" :
                    isProgressCurrent && finalDailyGoal !== null ? `${(goalProgress / 100) * 188.5} 188.5` : "0 188.5"
                  }
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {!userLoaded ? '...' :
                   (!examCountry || !examLanguage) ? '?' :
                   isProgressCurrent && finalDailyGoal !== null ? `${Math.round(goalProgress)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Flame size={20} style={{ color: '#fb923c' }} />
                <span style={{ fontWeight: '600' }}>
                  {!userLoaded ? '...' : '7 дней'}
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '4px 0 0 0'
              }}>
                Streak
              </p>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={20} style={{ color: '#60a5fa' }} />
                <span style={{ fontWeight: '600' }}>
                  {!userLoaded ? '...' :
                   examDate ? `${Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дней` : 'Не установлено'}
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '4px 0 0 0'
              }}>
                До экзамена
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Быстрые действия
          </h3>
          
          <button 
            onClick={handleStart}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Play size={24} />
              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                {t('home.startRevision')}
              </span>
            </div>
            <ChevronRight size={20} />
          </button>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button 
              onClick={handleNewQuestions}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Sparkles size={20} style={{ color: '#059669' }} />
                <span style={{ fontWeight: '500', color: '#111827' }}>Новые</span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                Неизученные вопросы
              </p>
            </button>
            
            <button 
              onClick={handleIncorrectQuestions}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                padding: '16px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <AlertCircle size={20} style={{ color: '#dc2626' }} />
                <span style={{ fontWeight: '500', color: '#111827' }}>Ошибки</span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                Работа над ошибками
              </p>
            </button>
          </div>
        </div>

        {/* Overall Progress - всегда показываем */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          opacity: (!userLoaded || !stats) ? 0.7 : 1,
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Общий прогресс
            </h3>
            <span style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {!userLoaded || !stats ? '.../..' : `${stats.correct}/${stats.total_questions}`}
            </span>
          </div>
          
          <div style={{
            width: '100%',
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            height: '8px',
            marginBottom: '8px'
          }}>
            <div 
              style={{
                backgroundColor: '#059669',
                height: '8px',
                borderRadius: '9999px',
                transition: 'all 1s ease-out',
                width: (!userLoaded || !stats) ? '0%' : 
                       `${stats.total_questions > 0 ? Math.round((stats.correct / stats.total_questions) * 100) : 0}%`
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {(!userLoaded || !stats) ? 'Загрузка...' :
               `${stats.total_questions > 0 ? Math.round((stats.correct / stats.total_questions) * 100) : 0}% завершено`}
            </p>
            {(!userLoaded || !stats) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #059669',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}
          </div>
        </div>
        </div>

        <BottomNavigation />
      </div>
    </>
  )
}

export default Home
