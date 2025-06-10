// src/pages/Authorize.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, getUserByTelegramId } from '../api/api'
import { AxiosError } from 'axios'
import { UserOut } from '../api/api' // Ваш тип

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
  fetch('/api/logs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: msg })})
    .catch(() => {})
}

const Authorize: React.FC = () => {
  const navigate = useNavigate()
  const setInternalId = useSession(state => state.setUserId)

  // состояние: checking – ждём GET-запроса, form – показываем форму, complete – ждём редиректа
  const [step, setStep] = useState<'checking' | 'form' | 'complete'>('checking')

  const [userName, setUserName] = useState('друг')
  const [examCountry, setExamCountry] = useState('')
  const [examLanguage, setExamLanguage] = useState('')
  const [uiLanguage, setUiLanguage] = useState('ru')
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp
      const tgUser = tg?.initDataUnsafe?.user

      if (!tg || !tgUser) {
        log('No Telegram WebApp or user – redirect to /home')
        return navigate('/home')
      }

      tg.ready()
      tg.expand()
      setUserName(tgUser.first_name || 'друг')

      try {
        log(`GET /users/by-telegram-id/${tgUser.id}`)
        const res = await getUserByTelegramId(tgUser.id)
        const user: UserOut = res.data
        log(`User exists: id=${user.id}`)

        // сохраняем внутренний ID и сразу на Home
        setInternalId(user.id)
        return navigate('/home')
      } catch (err) {
        const axiosErr = err as AxiosError
        if (axiosErr.response?.status === 404) {
          log('User not found (404) – show form')
          return setStep('form')
        }
        log(`Unexpected error: ${axiosErr.message}`)
        setError('Ошибка проверки пользователя')
      }
    }

    init()
  }, [navigate, setInternalId])

  const handleSubmit = async () => {
    if (!examCountry || !examLanguage) {
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
      log('POST /users/ (createUser)')
      const res = await createUser({
        telegram_id: tgUser.id,
        username: tgUser.username || undefined,
        first_name: tgUser.first_name || undefined,
        last_name: tgUser.last_name || undefined,
        exam_country: examCountry,
        exam_language: examLanguage,
        ui_language: uiLanguage,
      })
      log(`User created: id=${res.data.id}`)

      setInternalId(res.data.id)
      navigate('/home')
    } catch (err) {
      log(`Create user error: ${(err as Error).message}`)
      setError('Ошибка создания пользователя')
      setStep('form')
    }
  }

  if (step === 'checking') {
    return <div style={{ padding: 20 }}>Проверка данных пользователя...</div>
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
        <select value={examCountry} onChange={e => setExamCountry(e.target.value)} style={{ display: 'block', margin: '8px 0' }}>
          <option value="">— выберите —</option>
          {EXAM_COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      <label>
        Язык экзамена
        <select value={examLanguage} onChange={e => setExamLanguage(e.target.value)} style={{ display: 'block', margin: '8px 0' }}>
          <option value="">— выберите —</option>
          {EXAM_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </label>

      <label>
        Язык интерфейса
        <select value={uiLanguage} onChange={e => setUiLanguage(e.target.value)} style={{ display: 'block', margin: '8px 0' }}>
          {UI_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
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
