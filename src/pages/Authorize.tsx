// src/pages/Authorize.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, getUserByTelegramId } from '../api/api'
import { AxiosError } from 'axios'
import { UserOut } from '../api/api' // тип ответа

// Константы для выпадающих списков
const EXAM_COUNTRIES = [
  { value: 'am', label: '🇦🇲' }
]

const EXAM_LANGUAGES = [
  { value: 'ru', label: 'Русский' }
]

const UI_LANGUAGES = [
  { value: 'ru', label: 'Русский' }
]

// 🔧 Логирование на Vercel
function logToVercel(message: string) {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }).catch(err => console.error('[LOG ERROR]', err))
}

const Authorize: React.FC = () => {
  const internalId = useSession(state => state.userId)          // <-- новый
  const setInternalId = useSession(state => state.setUserId)
  const navigate = useNavigate()

  const [userName, setUserName] = useState<string>('друг')
  const [step, setStep] = useState<'checking' | 'form' | 'complete'>('checking')

  const [examCountry, setExamCountry] = useState('')
  const [examLanguage, setExamLanguage] = useState('')
  const [uiLanguage, setUiLanguage] = useState('ru')

  const [error, setError] = useState<string>('')

  // Если уже есть internalId, сразу уходим на Home
  useEffect(() => {
    if (internalId) {
      navigate('/home')
    }
  }, [internalId, navigate])

  // Основная проверка в тг WebApp – когда internalId ещё нет
  useEffect(() => {
    if (internalId) return  // не проверяем, если уже авторизованы

    const checkUser = async () => {
      const tg = window.Telegram?.WebApp
      const tgUser = tg?.initDataUnsafe?.user

      if (!tg || !tgUser) {
        navigate('/home')
        return
      }

      tg.ready()
      tg.expand()
      setUserName(tgUser.first_name || 'друг')

      try {
        const res = await getUserByTelegramId(tgUser.id)
        const user: UserOut = res.data
        logToVercel(`[AUTH] Found existing user id=${user.id}`)

        setInternalId(user.id)

        if (!user.exam_country || !user.exam_language) {
          setExamCountry(user.exam_country || '')
          setExamLanguage(user.exam_language || '')
          setUiLanguage(user.ui_language || 'ru')
          setStep('form')
        } else {
          navigate('/home')
        }
      } catch (err) {
        const axiosErr = err as AxiosError
        if (axiosErr.response?.status === 404) {
          setStep('form')
        } else {
          setError('Ошибка проверки пользователя')
          console.error('[AUTH] checkUser error', axiosErr)
        }
      }
    }

    checkUser()
  }, [internalId, navigate, setInternalId])

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
      const res = await createUser({
        telegram_id: tgUser.id,
        username: tgUser.username || undefined,
        first_name: tgUser.first_name || undefined,
        last_name: tgUser.last_name || undefined,
        exam_country: examCountry,
        exam_language: examLanguage,
        ui_language: uiLanguage,
      })

      logToVercel(`[AUTH] Created user id=${res.data.id}`)
      setInternalId(res.data.id)
      navigate('/home')
    } catch (err) {
      setError('Ошибка создания пользователя')
      console.error('[AUTH] createUser error', err)
      setStep('form')
    }
  }

  if (step === 'checking') {
    return <div style={{ padding: 20 }}>Проверка данных...</div>
  }

  if (step === 'complete') {
    return <div style={{ padding: 20 }}>Регистрация завершена...</div>
  }

  // step === 'form'
  return (
    <div style={{ padding: 20 }}>
      <h2>Привет, {userName}! Расскажите о себе:</h2>

      <label>
        Страна экзамена
        <select
          value={examCountry}
          onChange={e => setExamCountry(e.target.value)}
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
          value={examLanguage}
          onChange={e => setExamLanguage(e.target.value)}
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
          value={uiLanguage}
          onChange={e => setUiLanguage(e.target.value)}
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
