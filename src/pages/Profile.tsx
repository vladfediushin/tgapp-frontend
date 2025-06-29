// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

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
    getQuestions({
      user_id: userId,
      mode: 'interval_all',
      country: examCountry,
      language: examLanguage,
    })
      .then(res => setDueCount(res.data.length))
      .catch(err => console.error('Ошибка получения повторных вопросов:', err))
  }, [userId, examCountry, examLanguage])

  const handleBack = () => navigate('/home')

  if (loading || stats === null || dueCount === null) {
    return <div style={{ padding: 20 }}>{t('profile.loading')}</div>
  }

  const { total_questions, answered, correct } = stats
  const incorrect = answered - correct
  const unanswered = total_questions - answered

  return (
    <div style={{ padding: 20 }}>
      <h2>{t('profile.title')}</h2>

      {/* Настройки */}
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
                updateUser(userId, { exam_country: newCountry })
                  .catch(err => console.error('Ошибка обновления страны экзамена:', err))
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
                updateUser(userId, { exam_language: newLang })
                  .catch(err => console.error('Ошибка обновления языка экзамена:', err))
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
                updateUser(userId, { ui_language: newUi })
                  .catch(err => console.error('Ошибка обновления языка интерфейса:', err))
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

      {/* Статистика */}
      <section style={{ marginBottom: 24 }}>
        <h3>{t('profile.statsTitle')}</h3>
        <div>{t('profile.totalQuestions', { total: total_questions })}</div>
        <div>{t('profile.answered', { answered })}</div>
        <div>{t('profile.correct', { correct })}</div>
        <div>{t('profile.incorrect', { incorrect })}</div>
        <div>{t('profile.unanswered', { unanswered })}</div>
        <div>{t('profile.dueCount', { dueCount })}</div>
      </section>

      <button
        onClick={handleBack}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          backgroundColor: '#ECECEC',
          border: '1px solid #CCC',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        {t('profile.back')}
      </button>
    </div>
  )
}

export default Profile