// src/pages/Authorize.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, getUserByTelegramId } from '../api/api'
import { AxiosError } from 'axios'
import { UserOut } from '../api/api'

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

// Логирование для отладки
const log = (msg: string) => {
  console.log('[Authorize]', msg)
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg }),
  }).catch(() => {})
}

const Authorize: React.FC = () => {
  const navigate = useNavigate()

  // экшены стора
  const setInternalId       = useSession(state => state.setUserId)
  const setStoreExamCountry = useSession(state => state.setExamCountry)
  const setStoreExamLanguage= useSession(state => state.setExamLanguage)
  const setStoreUiLanguage  = useSession(state => state.setUiLanguage)

  const [step, setStep] = useState<'checking' | 'form' | 'complete'>('checking')
  const [userName, setUserName] = useState('друг')

  // локальные стейты для формы
  const [examCountryInput, setExamCountryInput]   = useState<string>('')
  const [examLanguageInput, setExamLanguageInput] = useState<string>('')
  const [uiLanguageInput, setUiLanguageInput]     = useState<string>('ru')

  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp
      const tgUser = tg?.initDataUnsafe?.user
      if (!tg || !tgUser) return navigate('/home')

      tg.ready()
      tg.expand()
      setUserName(tgUser.first_name || 'друг')

      try {
        const res = await getUserByTelegramId(tgUser.id)
        const user: UserOut = res.data

        // сохраняем ID и скипаем форму
        setInternalId(user.id)
        // гарантированно строка
        setStoreExamCountry(user.exam_country  ?? '')
        setStoreExamLanguage(user.exam_language ?? '')
        setStoreUiLanguage(user.ui_language     ?? '')
        return navigate('/home')
      } catch (err) {
        const axiosErr = err as AxiosError
        if (axiosErr.response?.status === 404) {
          return setStep('form')
        }
        setError('Ошибка проверки пользователя')
      }
    }
    init()
  }, [navigate, setInternalId, setStoreExamCountry, setStoreExamLanguage, setStoreUiLanguage])

  const handleSubmit = async () => {
    if (!examCountryInput || !examLanguageInput) {
      setError('Заполните обязательные поля')
      return
    }
    setError('')
    setStep('complete')

    const tg = window.Telegram?.WebApp
    const tgUser = tg?.initDataUnsafe?.user
    if (!tgUser) {
      setError('Не удалось получить данные Telegram')
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
      })

      // сохраняем в стор из ответа (гарантируя строку)
      setInternalId(res.data.id)
      setStoreExamCountry(res.data.exam_country  ?? '')
      setStoreExamLanguage(res.data.exam_language ?? '')
      setStoreUiLanguage(res.data.ui_language     ?? '')

      navigate('/home')
    } catch {
      setError('Ошибка создания пользователя')
      setStep('form')
    }
  }

  if (step === 'checking') {
    return <div style={{ padding: 20 }}>Проверка данных пользователя…</div>
  }
  if (step === 'complete') {
    return <div style={{ padding: 20 }}>Регистрация успешна! Переходим…</div>
  }

  // step === 'form'
  return (
    <div style={{ padding: 20 }}>
      <h2>Привет, {userName}! Укажи, пожалуйста, страну и язык:</h2>

      <label>
        Страна экзамена
        <select
          value={examCountryInput}
          onChange={e => setExamCountryInput(e.target.value)}
          style={{ display: 'block', margin: '8px 0' }}
        >
          <option value="">— выберите —</option>
          {EXAM_COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </label>

      <label>
        Язык экзамена
        <select
          value={examLanguageInput}
          onChange={e => setExamLanguageInput(e.target.value)}
          style={{ display: 'block', margin: '8px 0' }}
        >
          <option value="">— выберите —</option>
          {EXAM_LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </label>

      <label>
        Язык интерфейса
        <select
          value={uiLanguageInput}
          onChange={e => setUiLanguageInput(e.target.value)}
          style={{ display: 'block', margin: '8px 0' }}
        >
          {UI_LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </label>

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      <button
        onClick={handleSubmit}
        style={{
          display: 'block',
          marginTop: 20,
          padding: '10px',
          width: '100%',
          backgroundColor: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        Сохранить и продолжить
      </button>
    </div>
  )
}

export default Authorize
