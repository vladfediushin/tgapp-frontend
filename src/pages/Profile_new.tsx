// Working Profile.tsx - rebuilt from scratch with modern design
/// <reference path="../global.d.ts" />
import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser, getDailyProgress } from '../api/api'
import { useTranslation } from 'react-i18next'
import HomeButton from '../components/HomeButton'
import { User, Settings, Edit3, ChevronDown, Calendar, Target, TrendingUp, Activity, BarChart3 } from 'lucide-react'
import { calculateDailyGoal } from '../utils/dailyGoals'
import LoadingSpinner from '../components/LoadingSpinner'

const EXAM_COUNTRIES = [
  { value: 'am', label: '🇦🇲 Армения' },
  { value: 'kz', label: '🇰🇿 Казахстан' },
  { value: 'by', label: '🇧🇾 Беларусь' },
]

const EXAM_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

// Move this function outside the component to avoid dependency issues
function getLast7LocalDates(): string[] {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const localDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(localDateString(d))
  }
  return dates
}

const Profile = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const userId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)
  const examDate = useSession(state => state.examDate)
  const manualDailyGoal = useSession(state => state.manualDailyGoal)

  const setExamCountry = useSession(state => state.setExamCountry)
  const setExamLanguage = useSession(state => state.setExamLanguage)

  const [stats, setStats] = useState<UserStats | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Streak logic states
  const [streakProgress, setStreakProgress] = useState<number[]>([])
  const [streakLoading, setStreakLoading] = useState(true)

  const last7Dates = useMemo(() => getLast7LocalDates(), [])

  // Main stats loading effect
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    getUserStats(userId)
      .then(res => {
        setStats(res.data)
        setError(null)
      })
      .catch(err => {
        console.error('Ошибка получения статистики:', err)
        setError('Failed to load profile data')
        setStats(null)
      })
      .finally(() => setLoading(false))

    // Load due questions count
    if (examCountry && examLanguage) {
      getQuestions({
        user_id: userId,
        mode: 'interval_all',
        country: examCountry,
        language: examLanguage,
      })
        .then(res => setDueCount(res.data.length))
        .catch(err => {
          console.error('Ошибка получения повторных вопросов:', err)
          setDueCount(0)
        })
    } else {
      setDueCount(0)
    }
  }, [userId, examCountry, examLanguage])

  // Streak data loading effect
  useEffect(() => {
    if (!userId) return

    setStreakLoading(true)
    Promise.all(
      last7Dates.map(date => getDailyProgress(userId, date))
    ).then(responses => {
      setStreakProgress(responses.map(res => res.data.questions_mastered_today || 0))
    }).catch(err => {
      console.error('Ошибка загрузки streak данных:', err)
      setStreakProgress(new Array(7).fill(0))
    }).finally(() => setStreakLoading(false))
  }, [userId, last7Dates])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ 
          color: '#dc2626', 
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Ошибка: {error}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            Повторить
          </button>
          <button 
            onClick={() => navigate('/home')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ 
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Данные профиля недоступны
        </div>
        <button 
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer'
          }}
        >
          На главную
        </button>
      </div>
    )
  }

  const { total_questions, answered, correct } = stats
  const incorrect = answered - correct
  const unanswered = total_questions - answered

  // Calculate daily goal using the same logic as Home.tsx
  const dailyGoalData = stats
    ? calculateDailyGoal(examDate, stats.total_questions, stats.correct)
    : null
  const finalDailyGoal = manualDailyGoal ?? dailyGoalData?.dailyGoal ?? 10
  const streak = streakProgress.map(p => p >= finalDailyGoal)

  // User info (Telegram Mini App)
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const userName = tgUser?.first_name || 'User'

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
          gap: '16px'
        }}>
          <HomeButton />
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            {t('profile.title')}
          </h1>
        </div>
      </div>

      <div style={{ padding: '24px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* User Profile Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              👨‍💼
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 4px 0'
              }}>
                {userName}
              </h2>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '14px'
              }}>
                Изучающий теорию вождения
              </p>
            </div>
            <button
              style={{
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onClick={() => navigate('/exam-settings')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              <Settings size={20} color="#6b7280" />
            </button>
          </div>
          
          {/* Country and Language Selection */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button
              style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #d1fae5',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onClick={() => setShowCountrySelect(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1fae5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ecfdf5'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '12px',
                    color: '#059669',
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    Страна
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#111827',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {EXAM_COUNTRIES.find(c => c.value === examCountry)?.label || 'Не выбрано'}
                  </p>
                </div>
                <ChevronDown size={16} color="#059669" />
              </div>
            </button>

            <button
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onClick={() => setShowLanguageSelect(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '12px',
                    color: '#2563eb',
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    Язык
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#111827',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {EXAM_LANGUAGES.find(l => l.value === examLanguage)?.label || 'Не выбрано'}
                  </p>
                </div>
                <ChevronDown size={16} color="#2563eb" />
              </div>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Target size={24} color="#059669" />
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {correct}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Правильных ответов
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <BarChart3 size={24} color="#f59e0b" />
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {total_questions > 0 ? Math.round((correct / total_questions) * 100) : 0}%
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Общий прогресс
            </p>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            Детальная статистика
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <span style={{ color: '#6b7280' }}>Всего вопросов</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{total_questions}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <span style={{ color: '#6b7280' }}>Отвечено</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{answered}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <span style={{ color: '#6b7280' }}>Правильно</span>
              <span style={{ fontWeight: '600', color: '#059669' }}>{correct}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <span style={{ color: '#6b7280' }}>Неправильно</span>
              <span style={{ fontWeight: '600', color: '#dc2626' }}>{incorrect}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0'
            }}>
              <span style={{ color: '#6b7280' }}>Не отвечено</span>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>{unanswered}</span>
            </div>
          </div>
        </div>

        {/* Exam Date and Goal */}
        {examDate && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <Calendar size={20} color="#059669" />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Экзамен
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                {new Date(examDate).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                Осталось дней: {Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
            
            {finalDailyGoal && (
              <div style={{
                marginTop: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#2563eb',
                  margin: '0 0 4px 0',
                  fontWeight: '500'
                }}>
                  Ежедневная цель
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {finalDailyGoal} вопросов в день
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Country Selection Modal */}
      {showCountrySelect && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }} 
          onClick={() => setShowCountrySelect(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px',
              width: '100%',
              maxWidth: '400px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ 
              marginBottom: '16px', 
              fontSize: '20px', 
              fontWeight: '600', 
              textAlign: 'center',
              color: '#111827'
            }}>
              {t('profile.examCountryLabel')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXAM_COUNTRIES.map(c => (
                <button
                  key={c.value}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: c.value === examCountry ? '2px solid #059669' : '1px solid #e5e7eb',
                    background: c.value === examCountry ? '#ecfdf5' : '#fff',
                    fontWeight: c.value === examCountry ? '600' : '500',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (c.value !== examCountry) {
                      e.currentTarget.style.background = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (c.value !== examCountry) {
                      e.currentTarget.style.background = '#fff'
                    }
                  }}
                  onClick={() => {
                    setExamCountry(c.value)
                    setShowCountrySelect(false)
                    updateUser({ exam_country: c.value }).catch(console.error)
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageSelect && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }} 
          onClick={() => setShowLanguageSelect(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px',
              width: '100%',
              maxWidth: '400px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ 
              marginBottom: '16px', 
              fontSize: '20px', 
              fontWeight: '600', 
              textAlign: 'center',
              color: '#111827'
            }}>
              {t('profile.examLanguageLabel')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXAM_LANGUAGES.map(l => (
                <button
                  key={l.value}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: l.value === examLanguage ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    background: l.value === examLanguage ? '#eff6ff' : '#fff',
                    fontWeight: l.value === examLanguage ? '600' : '500',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (l.value !== examLanguage) {
                      e.currentTarget.style.background = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (l.value !== examLanguage) {
                      e.currentTarget.style.background = '#fff'
                    }
                  }}
                  onClick={() => {
                    setExamLanguage(l.value)
                    setShowLanguageSelect(false)
                    updateUser({ exam_language: l.value }).catch(console.error)
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
