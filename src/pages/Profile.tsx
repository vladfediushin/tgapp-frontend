// Working Profile.tsx - rebuilt from scratch
/// <reference path="../global.d.ts" />
import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser, getDailyProgress } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'
import { FaUserEdit, FaSignOutAlt, FaRedo, FaGlobe, FaFlag } from 'react-icons/fa'

const EXAM_COUNTRIES = [
  { value: 'am', label: '🇦🇲 Армения' },
  { value: 'kz', label: '🇰🇿 Казахстан' },
  { value: 'by', label: '🇧🇾 Беларусь' },
]

const EXAM_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

const UI_LANGUAGES = [
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
  const uiLanguage = useSession(state => state.uiLanguage)

  const setExamCountry = useSession(state => state.setExamCountry)
  const setExamLanguage = useSession(state => state.setExamLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)

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

  const handleBack = () => navigate('/home')

  const handleExamSettingsSave = () => {
    console.log('Exam settings saved from profile!')
  }

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

  const dailyGoal = stats?.total_questions ? Math.min(10, stats.total_questions) : 10
  const streak = streakProgress.map(p => p >= dailyGoal)

  // User info (Telegram Mini App)
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const userName = tgUser?.first_name || 'User'
  const userAvatar = tgUser?.photo_url || '/speedometer.gif'

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <img src={userAvatar} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', marginRight: 16 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{userName}</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title={t('profile.editProfile')}>
          <FaUserEdit size={24} />
        </button>
      </div>

      {/* Country & Language widgets */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {/* Country Widget */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{t('profile.examCountryLabel')}</div>
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: 12, cursor: 'pointer', border: 'none' }}
            onClick={() => setShowCountrySelect(true)}
          >
            <span style={{ fontSize: 24, marginRight: 8 }}>
              {EXAM_COUNTRIES.find(c => c.value === examCountry)?.label.split(' ')[0]}
            </span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              {EXAM_COUNTRIES.find(c => c.value === examCountry)?.label.split(' ').slice(1).join(' ')}
            </span>
          </button>
          {/* Country select modal */}
          {showCountrySelect && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000 }} onClick={() => setShowCountrySelect(false)}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 320, margin: '80px auto', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <h4 style={{ marginBottom: 12 }}>{t('profile.examCountryLabel')}</h4>
                {EXAM_COUNTRIES.map(c => (
                  <button key={c.value} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: c.value === examCountry ? '2px solid #2AABEE' : '1px solid #ccc', background: c.value === examCountry ? '#e3f2fd' : '#fff', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => {
                      setExamCountry(c.value)
                      setShowCountrySelect(false)
                      if (userId) {
                        updateUser(userId, { exam_country: c.value }).catch(err => console.error('Ошибка обновления страны экзамена:', err))
                      }
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{c.label.split(' ')[0]}</span>
                    <span>{c.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Language Widget */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{t('profile.examLanguageLabel')}</div>
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: 12, cursor: 'pointer', border: 'none' }}
            onClick={() => setShowLanguageSelect(true)}
          >
            <span style={{ fontSize: 20, marginRight: 8 }}>
              {EXAM_LANGUAGES.find(l => l.value === examLanguage)?.label === 'Русский' ? '🇷🇺' : '🇬🇧'}
            </span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              {EXAM_LANGUAGES.find(l => l.value === examLanguage)?.label}
            </span>
          </button>
          {/* Language select modal */}
          {showLanguageSelect && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000 }} onClick={() => setShowLanguageSelect(false)}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 320, margin: '80px auto', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <h4 style={{ marginBottom: 12 }}>{t('profile.examLanguageLabel')}</h4>
                {EXAM_LANGUAGES.map(l => (
                  <button key={l.value} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: l.value === examLanguage ? '2px solid #2AABEE' : '1px solid #ccc', background: l.value === examLanguage ? '#e3f2fd' : '#fff', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => {
                      setExamLanguage(l.value)
                      setShowLanguageSelect(false)
                      if (userId) {
                        updateUser(userId, { exam_language: l.value }).catch(err => console.error('Ошибка обновления языка экзамена:', err))
                      }
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{l.label === 'Русский' ? '🇷🇺' : '🇬🇧'}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Streak */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>{t('profile.dailyStreak')}</h3>
        {streakLoading ? (
          <div>{t('profile.loading')}</div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            {last7Dates.map((date, idx) => (
              <div key={date} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: streak[idx] ? '#4CAF50' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: streak[idx] ? '#fff' : '#333',
                  fontWeight: 700,
                  fontSize: 16,
                  border: streak[idx] ? '2px solid #388e3c' : '2px solid #ccc',
                  position: 'relative',
                }}>
                  {streak[idx] ? '✔' : streakProgress[idx]}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{date.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
        {/* Daily goal and exam date info */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: '#e3f2fd', borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 14 }}>
            {t('profile.dailyGoal')}: {dailyGoal}
          </div>
          {stats.exam_date && (
            <div style={{ flex: 1, background: '#fff3e0', borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 14 }}>
              {t('profile.examDate')}: {stats.exam_date}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888' }}>{t('profile.totalQuestions', { total: total_questions })}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{total_questions}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888' }}>{t('profile.answered')}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{answered}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#888' }}>{t('profile.correct')}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{correct}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button title={t('profile.resetProgress')} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          <FaRedo /> {t('profile.resetProgress')}
        </button>
        <button title={t('profile.logout')} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          <FaSignOutAlt /> {t('profile.logout')}
        </button>
      </div>

      {/* Basic Settings */}
      <section style={{ marginBottom: 24 }}>
        <h3>{t('profile.settings')}</h3>

        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.examCountryLabel')}
          <select
            value={examCountry}
            onChange={e => {
              const newCountry = e.target.value
              setExamCountry(newCountry)
              if (userId) {
                updateUser(userId, { exam_country: newCountry }).catch(err =>
                  console.error('Ошибка обновления страны экзамена:', err)
                )
              }
            }}
            style={{ display: 'block', marginTop: 4 }}
          >
            {EXAM_COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.examLanguageLabel')}
          <select
            value={examLanguage}
            onChange={e => {
              const newLang = e.target.value
              setExamLanguage(newLang)
              if (userId) {
                updateUser(userId, { exam_language: newLang }).catch(err =>
                  console.error('Ошибка обновления языка экзамена:', err)
                )
              }
            }}
            style={{ display: 'block', marginTop: 4 }}
          >
            {EXAM_LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.uiLanguageLabel')}
          <select
            value={uiLanguage}
            onChange={e => {
              const newUi = e.target.value
              setUiLanguage(newUi)
              i18n.changeLanguage(newUi)
              if (userId) {
                updateUser(userId, { ui_language: newUi }).catch(err =>
                  console.error('Ошибка обновления языка интерфейса:', err)
                )
              }
            }}
            style={{ display: 'block', marginTop: 4 }}
          >
            {UI_LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section style={{ marginBottom: 24 }}>
        <ExamSettingsComponent showTitle={true} compact={false} onSave={handleExamSettingsSave} />
      </section>

      {/* Advanced Settings Link */}
      <button
        onClick={() => navigate('/settings')}
        style={{ display: 'block', width: '100%', padding: '12px', backgroundColor: '#2AABEE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginBottom: 16 }}
      >
        {t('profile.advancedSettings')}
      </button>

      <button
        onClick={handleBack}
        style={{ display: 'block', width: '100%', padding: '12px', backgroundColor: '#ECECEC', border: '1px solid #CCC', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        {t('profile.back')}
      </button>
    </div>
  )
}

export default Profile
