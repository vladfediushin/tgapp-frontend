// src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
// ВАЖНО: импортируем ТОЛЬКО существующие функции из api.ts
import { getUserStats, UserStats, getQuestions, updateUser } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'

// ВАЖНО: Используем ХАРДКОД массивы, т.к. в API нет endpoints для получения стран/языков
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

  // ВАЖНО: Получаем данные из zustand store
  const userId = useSession(state => state.userId) // это string согласно store
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)
  const uiLanguage = useSession(state => state.uiLanguage)

  // Функции для обновления store
  const setExamCountry = useSession(state => state.setExamCountry)
  const setExamLanguage = useSession(state => state.setExamLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)

  // Локальный state для статистики
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // ВАЖНО: Загружаем статистику и количество вопросов для повторения
  useEffect(() => {
    if (!userId) return
    
    setLoading(true)
    
    // ВАЖНО: getUserStats принимает userId как string
    getUserStats(userId)
      .then(res => setStats(res.data))
      .catch(err => console.error('Ошибка получения статистики:', err))
      .finally(() => setLoading(false))
    
    // ВАЖНО: getQuestions принимает объект параметров
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
    // Callback когда настройки экзамена сохранены
    console.log('Exam settings saved from profile!')
  }

  // Показываем загрузку пока данные не готовы
  if (loading || stats === null || dueCount === null) {
    return <div style={{ padding: 20 }}>{t('profile.loading')}</div>
  }

  // Деструктурируем статистику
  const { total_questions, answered, correct } = stats
  const incorrect = answered - correct
  const unanswered = total_questions - answered

  return (
    <div style={{ padding: 20 }}>
      <h2>{t('profile.title')}</h2>

      {/* Настройки */}
      <section style={{ marginBottom: 24 }}>
        <h3>{t('profile.settings')}</h3>
        
        {/* ВАЖНО: Выбор страны экзамена */}
        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.examCountryLabel')}
          <select
            value={examCountry}
            onChange={e => {
              const newCountry = e.target.value
              // Обновляем в store
              setExamCountry(newCountry)
              // ВАЖНО: Синхронизируем с backend через updateUser
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

        {/* ВАЖНО: Выбор языка экзамена */}
        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.examLanguageLabel')}
          <select
            value={examLanguage}
            onChange={e => {
              const newLang = e.target.value
              // Обновляем в store
              setExamLanguage(newLang)
              // ВАЖНО: Синхронизируем с backend через updateUser
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

        {/* ВАЖНО: Выбор языка интерфейса */}
        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('profile.uiLanguageLabel')}
          <select
            value={uiLanguage}
            onChange={e => {
              const newUi = e.target.value
              // Обновляем в store
              setUiLanguage(newUi)
              // ВАЖНО: Меняем язык в i18n
              i18n.changeLanguage(newUi)
              // ВАЖНО: Синхронизируем с backend через updateUser
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

      {/* ВАЖНО: Компонент настроек экзамена (дата экзамена и дневная цель) */}
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