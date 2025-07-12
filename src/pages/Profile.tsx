// Working Profile.tsx - rebuilt from scratch
/// <reference path="../global.d.ts" />
import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser, getDailyProgress } from '../api/api'
import { useTranslation } from 'react-i18next'
import HomeButton from '../components/HomeButton'
import { FaUserEdit, FaCog, FaEdit } from 'react-icons/fa'
import { calculateDailyGoal } from '../utils/dailyGoals'

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

  const [stats, setStats] = useState(null)
  const [dueCount, setDueCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCountrySelect, setShowCountrySelect] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [error, setError] = useState(null)

  // Streak logic states
  const [streakProgress, setStreakProgress] = useState([])
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
      last7Dates.map(date => getDailyProgress(userId, date).then(res => res.data.questions_mastered_today).catch(() => 0))
    ).then(progressArr => {
      setStreakProgress(progressArr)
    }).finally(() => setStreakLoading(false))
  }, [userId, last7Dates])

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка профиля...</div>
  }

  if (!userId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ color: 'red', marginBottom: 16 }}>
          Не удалось получить данные пользователя
        </div>
        <button onClick={() => navigate('/home')}>На главную</button>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ color: 'red', marginBottom: 16 }}>
          Ошибка: {error}
        </div>
        <button onClick={() => window.location.reload()}>Повторить</button>
        <button onClick={() => navigate('/home')} style={{ marginLeft: 10 }}>На главную</button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: 20 }}>
        <div>Данные профиля недоступны</div>
        <button onClick={() => navigate('/home')}>На главную</button>
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
  const userAvatar = tgUser?.photo_url || '/speedometer.gif'

  return (
    <div style={{ padding: 20 }}>
      {/* Uniform Header with HomeButton */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <HomeButton style={{ marginRight: 16 }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {t('profile.title')}
        </h1>
      </div>

      {/* User Profile Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
        <img src={userAvatar} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', marginRight: 16 }} />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{userName}</div>
          </div>
          {/* Country and Language buttons - full width */}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {/* Country button */}
            <button
              style={{ 
                flex: 1,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f0f8ff', 
                border: '1px solid #2AABEE', 
                borderRadius: 20, 
                padding: '6px 8px', 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
              onClick={() => setShowCountrySelect(true)}
            >
              <span style={{ color: '#2AABEE', marginRight: 4 }}>Страна:</span>
              <span style={{ fontSize: 16 }}>
                {EXAM_COUNTRIES.find(c => c.value === examCountry)?.label.split(' ')[0] || '🇦🇲'}
              </span>
            </button>
            {/* Language button */}
            <button
              style={{ 
                flex: 1,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f0f8ff', 
                border: '1px solid #2AABEE', 
                borderRadius: 20, 
                padding: '6px 8px', 
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
              onClick={() => setShowLanguageSelect(true)}
            >
              <span style={{ color: '#2AABEE', marginRight: 4 }}>Язык:</span>
              <span style={{ fontSize: 16 }}>
                {EXAM_LANGUAGES.find(l => l.value === examLanguage)?.label === 'Русский' ? '🇷🇺' : '🇬🇧'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Country Selection Modal */}
      {showCountrySelect && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCountrySelect(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 350, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600, textAlign: 'center' }}>{t('profile.examCountryLabel')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAM_COUNTRIES.map(c => (
                <button 
                  key={c.value} 
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    borderRadius: 12, 
                    border: c.value === examCountry ? '2px solid #2AABEE' : '1px solid #e0e0e0', 
                    background: c.value === examCountry ? '#f0f8ff' : '#fff', 
                    fontWeight: c.value === examCountry ? 600 : 500, 
                    fontSize: 16, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setExamCountry(c.value)
                    setShowCountrySelect(false)
                    if (userId) {
                      updateUser(userId, { exam_country: c.value }).catch(err => console.error('Ошибка обновления страны экзамена:', err))
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (c.value !== examCountry) {
                      e.target.style.background = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (c.value !== examCountry) {
                      e.target.style.background = '#fff'
                    }
                  }}
                >
                  <span style={{ fontSize: 24 }}>{c.label.split(' ')[0]}</span>
                  <span>{c.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageSelect && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLanguageSelect(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 350, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600, textAlign: 'center' }}>{t('profile.examLanguageLabel')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAM_LANGUAGES.map(l => (
                <button 
                  key={l.value} 
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    borderRadius: 12, 
                    border: l.value === examLanguage ? '2px solid #2AABEE' : '1px solid #e0e0e0', 
                    background: l.value === examLanguage ? '#f0f8ff' : '#fff', 
                    fontWeight: l.value === examLanguage ? 600 : 500, 
                    fontSize: 16, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setExamLanguage(l.value)
                    setShowLanguageSelect(false)
                    if (userId) {
                      updateUser(userId, { exam_language: l.value }).catch(err => console.error('Ошибка обновления языка экзамена:', err))
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (l.value !== examLanguage) {
                      e.target.style.background = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (l.value !== examLanguage) {
                      e.target.style.background = '#fff'
                    }
                  }}
                >
                  <span style={{ fontSize: 20 }}>{l.label === 'Русский' ? '🇷🇺' : '🇬🇧'}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Streak Block */}
      <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>{t('profile.dailyStreak')}</h3>
        {streakLoading ? (
          <div>{t('profile.loading')}</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 16 }}>
            {last7Dates.map((date, idx) => (
              <div key={date} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: streak[idx] ? '#4CAF50' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: streak[idx] ? '#fff' : '#333',
                  fontWeight: 700,
                  fontSize: 14,
                  border: streak[idx] ? '2px solid #388e3c' : '2px solid #ccc',
                  margin: '0 auto'
                }}>
                  {streak[idx] ? '✔' : streakProgress[idx]}
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{date.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
        {/* Daily goal and exam date info */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, background: '#e3f2fd', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 14 }}>
            {t('profile.goal')}: {finalDailyGoal}
          </div>
          {stats.exam_date && (
            <div style={{ flex: 1, background: '#fff3e0', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 14 }}>
              {t('profile.examDate')}: {stats.exam_date}
            </div>
          )}
          <button
            style={{
              background: '#f0f8ff',
              border: '1px solid #2AABEE',
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t('profile.editSettings')}
            onClick={() => navigate('/exam-settings')}
          >
            <FaEdit size={16} color="#2AABEE" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center', height: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, color: '#888', height: '25%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>{t('profile.totalQuestions')}</div>
          <div style={{ fontSize: 22, fontWeight: 700, height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{total_questions}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center', height: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, color: '#888', height: '25%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>{t('profile.answered')}</div>
          <div style={{ fontSize: 22, fontWeight: 700, height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{answered}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center', height: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, color: '#888', height: '25%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>{t('profile.correct')}</div>
          <div style={{ fontSize: 22, fontWeight: 700, height: '75%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{correct}</div>
        </div>
      </div>
    </div>
  )
}

export default Profile
