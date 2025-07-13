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

  if (step === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <LoadingSpinner size={64} />
          <p className="text-xl text-gray-700 mt-6 font-medium">{t('authorize.checking')}</p>
          <p className="text-gray-500 mt-2">{t('authorize.checkingSubtitle')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 p-6 pb-24">
        {step === 'form' && (
          <div className="max-w-md mx-auto">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-lg flex items-center justify-center">
                <UserCheck size={40} className="text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('authorize.welcome', { userName })}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {t('authorize.intro')}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Exam Country */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <MapPin size={16} className="text-blue-600" />
                  {t('authorize.label.examCountry')}
                </label>
                <select
                  value={examCountryInput}
                  onChange={e => setExamCountryInput(e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Languages size={16} className="text-blue-600" />
                  {t('authorize.label.examLanguage')}
                </label>
                <select
                  value={examLanguageInput}
                  onChange={e => setExamLanguageInput(e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Globe size={16} className="text-blue-600" />
                  {t('authorize.label.uiLanguage')}
                </label>
                <select
                  value={uiLanguageInput}
                  onChange={e => setUiLanguageInput(e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {t('authorize.button.next')}
            </button>

            {/* Footer Info */}
            <p className="mt-6 text-sm text-gray-500 text-center leading-relaxed">
              {t('authorize.footer.info')}
            </p>
          </div>
        )}

        {step === 'exam_settings' && (
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-lg flex items-center justify-center">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Почти готово, {userName}!
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Хотите настроить дату экзамена и ежедневную цель? Это поможет приложению 
                рекомендовать оптимальный темп изучения.
              </p>
            </div>

            {/* Exam Settings Component */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <ExamSettingsComponent 
                showTitle={false} 
                compact={true}
                onSave={handleExamSettingsSave}
              />
            </div>

            {/* Skip Button */}
            <button
              onClick={handleSkipExamSettings}
              className="w-full p-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Пропустить (настроить позже)
            </button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Authorize
