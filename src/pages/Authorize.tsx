// src/pages/Authorize.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, getUserByTelegramId, getTopics } from '../api/api'
import { AxiosError } from 'axios'
import { UserOut } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'  // Import the component
import LoadingSpinner from '../components/LoadingSpinner'

// Список стран
const EXAM_COUNTRIES = [
  { value: 'am', label: '🇦🇲 Армения' },
  { value: 'kz', label: '🇰🇿 Казахстан' },
  { value: 'by', label: '🇧🇾 Беларусь' },
]

// Языки экзамена и интерфейса
const EXAM_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]
const UI_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

const Authorize: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // для этой страницы: подтягиваем языковой код из Telegram и ставим дефолт
  const tgUserInit = window.Telegram?.WebApp?.initDataUnsafe?.user
  const rawLang = tgUserInit?.language_code?.split('-')[0] ?? ''
  const hasLang = UI_LANGUAGES.some(l => l.value === rawLang)
  const defaultUiLang = hasLang ? rawLang : 'en'

  // экшены стора
  const setInternalId        = useSession(state => state.setUserId)
  const setStoreExamCountry  = useSession(state => state.setExamCountry)
  const setStoreExamLanguage = useSession(state => state.setExamLanguage)
  const setStoreUiLanguage   = useSession(state => state.setUiLanguage)
  const setTopics            = useSession(state => state.setTopics)

  const [step, setStep]         = useState<'checking' | 'form' | 'exam_settings' | 'complete'>('checking')
  const [userName, setUserName] = useState('друг')

  // локальные стейты для формы
  const [examCountryInput, setExamCountryInput]   = useState<string>('')
  const [examLanguageInput, setExamLanguageInput] = useState<string>('')
  const [uiLanguageInput, setUiLanguageInput]     = useState<string>(defaultUiLang)

  // State to track if user is new (needs to see exam settings)
  const [isNewUser, setIsNewUser] = useState(false)

  const [error, setError] = useState('')

  // меняем язык i18next на тот, что из Telegram (или en), и затем при выборе в форме
  useEffect(() => {
    i18n.changeLanguage(uiLanguageInput)
  }, [uiLanguageInput])

  // Первый эффект: проверяем, есть ли пользователь в БД
  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp
      const tgUser = tg?.initDataUnsafe?.user
      if (!tg || !tgUser) {
        setStep('complete')
        return
      }

      tg.ready()
      tg.expand()
      setUserName(tgUser.first_name || 'друг')

      try {
        const res = await getUserByTelegramId(tgUser.id)
        const user: UserOut = res.data

        // сохраняем в стор
        setInternalId(user.id)
        setStoreExamCountry(user.exam_country  ?? '')
        setStoreExamLanguage(user.exam_language ?? '')
        setStoreUiLanguage(user.ui_language     ?? '')

        // загружаем темы
        const topicsRes = await getTopics(
          user.exam_country  ?? '',
          user.exam_language ?? ''
        )
        setTopics(topicsRes.data.topics)

        // переходим на Home - existing user
        setStep('complete')
      } catch (err) {
        const axiosErr = err as AxiosError
        if (axiosErr.response?.status === 404) {
          // New user - show form
          setIsNewUser(true)
          setStep('form')
        } else {
          setError(t('authorize.error.checkUser'))
          setStep('form')
        }
      }
    }
    init()
  }, [
    t,
    setInternalId,
    setStoreExamCountry,
    setStoreExamLanguage,
    setStoreUiLanguage,
    setTopics,
  ])

  // Когда step становится complete — делаем navigate
  useEffect(() => {
    if (step === 'complete') {
      navigate('/home', { replace: true })
    }
  }, [step, navigate])

  const handleSubmit = async () => {
    if (!examCountryInput || !examLanguageInput) {
      setError(t('authorize.error.requiredFields'))
      return
    }
    setError('')

    const tg = window.Telegram?.WebApp
    const tgUser = tg?.initDataUnsafe?.user
    if (!tgUser) {
      setError(t('authorize.error.telegramData'))
      setStep('form')
      return
    }

    try {
      const res = await createUser({
        telegram_id: tgUser.id,
        username: tgUser.username || undefined,
        first_name: tgUser.first_name || undefined,
        last_name: tgUser.last_name || undefined,
        exam_country: examCountryInput,
        exam_language: examLanguageInput,
        ui_language: uiLanguageInput,
        // exam_date and daily_goal are optional - will be set in next step
      })

      setInternalId(res.data.id)
      setStoreExamCountry(res.data.exam_country  ?? '')
      setStoreExamLanguage(res.data.exam_language ?? '')
      setStoreUiLanguage(res.data.ui_language     ?? '')

      // подтягиваем темы
      const topicsRes = await getTopics(
        res.data.exam_country  ?? '',
        res.data.exam_language ?? ''
      )
      setTopics(topicsRes.data.topics)

      // Show exam settings step for new users
      setStep('exam_settings')
    } catch {
      setError(t('authorize.error.createUser'))
      setStep('form')
    }
  }

  const handleExamSettingsSave = () => {
    // User saved exam settings, move to complete
    setStep('complete')
  }

  const handleSkipExamSettings = () => {
    // User skipped exam settings, move to complete
    setStep('complete')
  }

  return (
    <div style={{ padding: 20 }}>
      {step === 'checking' && (
        <div style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f9f9f9'
        }}>
          <LoadingSpinner size={64} />
          <p style={{ fontSize: 18, color: '#333', marginTop: 16 }}>{t('authorize.checking')}</p>
        </div>
      )}

      {step === 'form' && (
        <>
          <h2>{t('authorize.welcome', { userName })}</h2>
          <p style={{ marginBottom: 20, color: '#666' }}>
            {t('authorize.intro')}
          </p>

          {/* Форма ввода данных */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>
                {t('authorize.label.examCountry')}
              </label>
              <select
                value={examCountryInput}
                onChange={e => setExamCountryInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                <option value="">{t('authorize.placeholder.selectCountry')}</option>
                {EXAM_COUNTRIES.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>
                {t('authorize.label.examLanguage')}
              </label>
              <select
                value={examLanguageInput}
                onChange={e => setExamLanguageInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                <option value="">{t('authorize.placeholder.selectLanguage')}</option>
                {EXAM_LANGUAGES.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>
                {t('authorize.label.uiLanguage')}
              </label>
              <select
                value={uiLanguageInput}
                onChange={e => setUiLanguageInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                <option value="">{t('authorize.placeholder.selectLanguage')}</option>
                {UI_LANGUAGES.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p style={{ color: 'red', marginBottom: 20 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {t('authorize.button.next')}
          </button>

          <p style={{
            marginTop: 20,
            fontSize: 14,
            color: '#666',
            textAlign: 'center'
          }}>
            {t('authorize.footer.info')}
          </p>
        </>
      )}

      {step === 'exam_settings' && (
        <div style={{ padding: 20 }}>
          <h2>Почти готово, {userName}!</h2>
          <p style={{ marginBottom: 20, color: '#666' }}>
            Хотите настроить дату экзамена и ежедневную цель? Это поможет приложению 
            рекомендовать оптимальный темп изучения. Эти настройки необязательны — 
            вы можете пропустить их и добавить позже.
          </p>

          {/* Embed the ExamSettingsComponent */}
          <ExamSettingsComponent 
            showTitle={false} 
            compact={true}
            onSave={handleExamSettingsSave}
          />

          <button
            onClick={handleSkipExamSettings}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              marginTop: '15px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Пропустить (настроить позже)
          </button>
        </div>
      )}
    </div>
  )
}

export default Authorize