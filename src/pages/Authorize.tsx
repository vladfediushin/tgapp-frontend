// src/pages/Authorize.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, getUserByTelegramId, getTopics } from '../api/api'
import { AxiosError } from 'axios'
import { UserOut } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'
import LoadingSpinner from '../components/LoadingSpinner'
import BottomNavigation from '../components/BottomNavigation'
import { UserCheck, Globe, MapPin, Languages, CheckCircle } from 'lucide-react'

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

const Authorize = () => {
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

  const [step, setStep]         = useState('checking')
  const [userName, setUserName] = useState('друг')

  // локальные стейты для формы
  const [examCountryInput, setExamCountryInput]   = useState('')
  const [examLanguageInput, setExamLanguageInput] = useState('')
  const [uiLanguageInput, setUiLanguageInput]     = useState(defaultUiLang)

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
        console.log('Checking user with Telegram ID:', tgUser.id)
        const res = await getUserByTelegramId(tgUser.id)
        console.log('User data received:', res.data)
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
        console.error('Error in user check:', err)
        const axiosErr = err as AxiosError
        if (axiosErr.response?.status === 404) {
          // New user - show form
          setIsNewUser(true)
          setStep('form')
        } else {
          console.error('Non-404 error details:', {
            status: axiosErr.response?.status,
            message: axiosErr.message,
            code: axiosErr.code
          })
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {step === 'checking' && (
        <LoadingSpinner 
          size={80} 
          text={t('authorize.checking')} 
          fullScreen 
        />
      )}

      {step === 'form' && (
        <div style={{
          flex: 1,
          padding: '24px',
          paddingBottom: '96px'
        }}>
          <div style={{
            maxWidth: '448px',
            margin: '0 auto'
          }}>
            {/* Welcome Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '50%',
                padding: '16px',
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={40} style={{ color: '#2563eb' }} />
              </div>
              <h1 style={{
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '8px'
              }}>
                {t('authorize.welcome', { userName })}
              </h1>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                {t('authorize.intro')}
              </p>
            </div>

            {/* Form */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Exam Country */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <MapPin size={16} style={{ color: '#2563eb' }} />
                  {t('authorize.label.examCountry')}
                </label>
                <select
                  value={examCountryInput}
                  onChange={e => setExamCountryInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#111827',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
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

              {/* Exam Language */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <Languages size={16} style={{ color: '#2563eb' }} />
                  {t('authorize.label.examLanguage')}
                </label>
                <select
                  value={examLanguageInput}
                  onChange={e => setExamLanguageInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#111827',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
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

              {/* UI Language */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  <Globe size={16} style={{ color: '#2563eb' }} />
                  {t('authorize.label.uiLanguage')}
                </label>
                <select
                  value={uiLanguageInput}
                  onChange={e => setUiLanguageInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#111827',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
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

            {/* Error Message */}
            {error && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px'
              }}>
                <p style={{
                  color: '#b91c1c',
                  fontSize: '14px',
                  margin: 0
                }}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                marginTop: '32px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              {t('authorize.button.next')}
            </button>

            {/* Footer Info */}
            <p style={{
              marginTop: '24px',
              fontSize: '14px',
              color: '#9ca3af',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              {t('authorize.footer.info')}
            </p>
          </div>
        </div>
      )}

      {step === 'exam_settings' && (
        <div style={{
          flex: 1,
          padding: '24px',
          paddingBottom: '96px'
        }}>
          <div style={{
            maxWidth: '448px',
            margin: '0 auto'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '50%',
                padding: '16px',
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={40} style={{ color: '#059669' }} />
              </div>
              <h1 style={{
                fontSize: '30px',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Почти готово, {userName}!
              </h1>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Хотите настроить дату экзамена и ежедневную цель? Это поможет приложению 
                рекомендовать оптимальный темп изучения. Эти настройки необязательны — 
                вы можете пропустить их и добавить позже.
              </p>
            </div>

            {/* Exam Settings Component */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #f3f4f6',
              marginBottom: '24px'
            }}>
              <ExamSettingsComponent 
                showTitle={false} 
                compact={true}
                onSave={handleExamSettingsSave}
              />
            </div>

            {/* Skip Button */}
            <button
              onClick={handleSkipExamSettings}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '12px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6'
              }}
            >
              Пропустить (настроить позже)
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}

export default Authorize
