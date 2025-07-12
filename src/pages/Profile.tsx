// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser } from '../api/api'
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

const Profile: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const userId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)
  const uiLanguage = useSession(state => state.uiLanguage)

  const setExamCountry = useSession(state => state.setExamCountry)
  const setExamLanguage = useSession(state => state.setExamLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)

  const [stats, setStats] = useState<UserStats | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    getUserStats(userId)
      .then(res => setStats(res.data))
      .catch(err => console.error('Ошибка получения статистики:', err))
      .finally(() => setLoading(false))

    if (examCountry && examLanguage) {
      getQuestions({
        user_id: userId,
        mode: 'interval_all',
        country: examCountry,
        language: examLanguage,
      })
        .then(res => setDueCount(res.data.length))
        .catch(err => console.error('Ошибка получения повторных вопросов:', err))
    } else {
      setDueCount(null)
    }
  }, [userId, examCountry, examLanguage])

  const handleBack = () => navigate('/home')

  const handleExamSettingsSave = () => {
    console.log('Exam settings saved from profile!')
  }

  if (loading || stats === null || dueCount === null) {
    return <div style={{ padding: 20 }}>{t('profile.loading')}</div>
  }

  const { total_questions, answered, correct } = stats
  const incorrect = answered - correct
  const unanswered = total_questions - answered

  // --- Streak logic: use local date strings for last 7 days ---
  function getLast7LocalDates() {
    const pad = n => n.toString().padStart(2, '0')
    const localDateString = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(localDateString(d))
    }
    return dates
  }

  // Example: fetch streak progress for each day (replace with real API call)
  const last7Dates = getLast7LocalDates()
  // TODO: Replace with real API call to getDailyProgress for each date
  // For now, mock data:
  const streakProgress = [10, 10, 7, 10, 3, 0, 10]
  const dailyGoal = stats?.total_questions ? Math.min(10, stats.total_questions) : 10
  const streak = streakProgress.map(p => p >= dailyGoal)

  // User info (Telegram Mini App)
  // @ts-ignore
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
  const userName = tgUser?.first_name || 'User'
  const userAvatar = tgUser?.photo_url || '/public/speedometer.gif'

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

      {/* Daily Streak */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>{t('profile.dailyStreak')}</h3>
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
        <button title={t('profile.changeLanguage')} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          <FaGlobe /> {t('profile.changeLanguage')}
        </button>
        <button title={t('profile.changeCountry')} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>
          <FaFlag /> {t('profile.changeCountry')}
        </button>
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
