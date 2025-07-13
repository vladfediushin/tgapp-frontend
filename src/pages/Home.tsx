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
import { Home as HomeIcon, User, BarChart3, Settings, Play, Flame, Calendar, ChevronRight, Shuffle, AlertCircle } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import i18n from 'i18next'
import LoadingSpinner from '../components/LoadingSpinner'

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
              {t('home.greeting', { name: userName })}
            </h1>
            <p style={{
              color: '#6b7280',
              margin: '4px 0 0 0',
              fontSize: '14px'
            }}>
              Продолжаем подготовку к экзамену
            </p>
          </div>
          <div style={{ fontSize: '32px' }}>
            👨‍💼
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Progress Card */}
        {isProgressCurrent && finalDailyGoal !== null && (
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
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
                  {t('home.todayProgress')}
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '4px 0 0 0',
                  fontSize: '14px'
                }}>
                  Отлично продвигаешься!
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
                    strokeDasharray={`${(goalProgress / 100) * 188.5} 188.5`}
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
                    {Math.round(goalProgress)}%
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
                    {/* здесь можно добавить streak, если есть */}
                    7 дней
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
                    {examDate ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : '-'} дней
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
        )}

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
            <button style={{
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
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Shuffle size={20} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: '500', color: '#111827' }}>Случайные</span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                Микс вопросов
              </p>
            </button>
            
            <button style={{
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
            }}>
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

        {/* Overall Progress */}
        {stats ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
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
                {stats.correct}/{stats.total_questions}
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
                  width: `${stats.total_questions > 0 ? Math.round((stats.correct / stats.total_questions) * 100) : 0}%`
                }}
              />
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {stats.total_questions > 0 ? Math.round((stats.correct / stats.total_questions) * 100) : 0}% завершено
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '60px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <LoadingSpinner size={28} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '8px 16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {[
            { id: 'home', icon: HomeIcon, label: t('home.profile'), onClick: () => navigate('/') },
            { id: 'profile', icon: User, label: t('home.profile'), onClick: () => navigate('/profile') },
            { id: 'stats', icon: BarChart3, label: t('home.statistics'), onClick: () => {} },
            { id: 'settings', icon: Settings, label: t('home.settings'), onClick: () => navigate('/settings') }
          ].map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                backgroundColor: item.id === 'home' ? '#ecfdf5' : 'transparent',
                color: item.id === 'home' ? '#059669' : '#6b7280',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (item.id !== 'home') {
                  e.target.style.color = '#111827'
                }
              }}
              onMouseLeave={(e) => {
                if (item.id !== 'home') {
                  e.target.style.color = '#6b7280'
                }
              }}
            >
              <item.icon size={24} />
              <span style={{ 
                fontSize: '12px', 
                marginTop: '4px',
                fontWeight: item.id === 'home' ? '500' : '400'
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
