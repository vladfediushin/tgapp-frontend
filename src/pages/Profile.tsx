// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, updateUser, getCountries, getLanguages } from '../api/api'  // ДОБАВИЛ getCountries, getLanguages
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'

// УБРАЛ хардкод списки - заменил на API

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

  // ДОБАВИЛ поля для дневной цели
  const examDate = useSession(state => state.examDate)
  const manualDailyGoal = useSession(state => state.manualDailyGoal)
  const setExamDate = useSession(state => state.setExamDate)
  const setManualDailyGoal = useSession(state => state.setManualDailyGoal)

  const [stats, setStats] = useState<UserStats | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // ДОБАВИЛ состояние для данных из API
  const [countries, setCountries] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // ДОБАВИЛ загрузку стран и языков
  useEffect(() => {
    Promise.all([getCountries(), getLanguages()])
      .then(([countriesRes, languagesRes]) => {
        setCountries(countriesRes.data)
        setLanguages(languagesRes.data)
      })
      .catch(err => console.error('Ошибка загрузки стран/языков:', err))
      .finally(() => setDataLoading(false))
  }, [])

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

  const handleExamSettingsSave = () => {
    // Optional: You can show a success message or refresh stats
    console.log('Exam settings saved from profile!')
  }

  if (loading || stats === null || dueCount === null || dataLoading) {
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
            {countries.map(country => (
              <option key={country} value={country}>
                {country.toUpperCase()}
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
            {languages.map(language => (
              <option key={language} value={language}>
                {language.toUpperCase()}
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
            {languages.map(language => (
              <option key={language} value={language}>
                {language.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ДОБАВИЛ секцию дневной цели */}
      <section style={{ marginBottom: 24 }}>
        <h3>{t('profile.dailyGoalSettings')}</h3>
        
        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.examDate')}:
          <input
            type="date"
            value={examDate || ''}
            onChange={e => setExamDate(e.target.value || null)}
            style={{ 
              display: 'block', 
              marginTop: 4, 
              padding: 8, 
              width: '100%',
              fontSize: 16
            }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
          <input
            type="checkbox"
            checked={manualDailyGoal === null}
            onChange={e => setManualDailyGoal(e.target.checked ? null : 30)}
            style={{ marginRight: 8 }}
          />
          {t('profile.useAutomaticGoal')}
        </label>

        {manualDailyGoal !== null && (
          <label style={{ display: 'block', margin: '8px 0' }}>
            {t('profile.manualDailyGoal')}:
            <input
              type="number"
              min={1}
              max={100}
              value={manualDailyGoal}
              onChange={e => setManualDailyGoal(parseInt(e.target.value) || 1)}
              style={{ 
                display: 'block', 
                marginTop: 4, 
                padding: 8, 
                width: '100%',
                fontSize: 16
              }}
            />
          </label>
        )}
      </section>

      {/* Exam Settings Component */}
      <section style={{ marginBottom: 24 }}>
        <ExamSettingsComponent 
          showTitle={true}
          compact={false}
          onSave={handleExamSettingsSave}
        />
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