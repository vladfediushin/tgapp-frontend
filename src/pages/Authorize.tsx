import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { createUser, UserOut, getUserIdByTelegramId } from '../api/api'
import { AxiosError } from 'axios'


// Константы для выпадающих списков — впоследствии переписать под извлекаемые из БД?
const EXAM_COUNTRIES = [
  { value: 'ru', label: 'Россия' },
  { value: 'kz', label: 'Казахстан' },
  { value: 'by', label: 'Беларусь' },
]

const EXAM_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'Английский' },
]

const UI_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

// 🔧 Утилита для логгирования на Vercel
function logToVercel(message: string) {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }).catch(err => {
    console.error('[LOG ERROR]', err)
  })
}

const Authorize: React.FC = () => {
  const [step, setStep] = useState<'checking' | 'form' | 'complete'>('checking')
  const [examCountry, setExamCountry] = useState('')
  const [examLanguage, setExamLanguage] = useState('')
  const [uiLanguage, setUiLanguage] = useState('ru')
  const [error, setError] = useState('')
  
  const setInternalId = useSession(state => state.setUserId)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      const tg = window.Telegram?.WebApp
      const user = tg?.initDataUnsafe?.user

      if (!tg || !user) {
        navigate('/home')
        return
      }

      tg.ready()
      tg.expand()

      try {
        const response = await getUserIdByTelegramId(user.id)
        setInternalId(response.data.id)
        navigate('/home')
      } catch (err) {
        const error = err as AxiosError
        if (error.response?.status === 404) {
          setStep('form')
        } else {
          setError('Ошибка проверки пользователя')
          console.error('Check user error:', error)
        }
      }
    }

    checkUser()
  }, [navigate, setInternalId])

  const handleSubmit = async () => {
    if (!examCountry || !examLanguage) {
      setError('Заполните обязательные поля')
      return
    }

    setError('')
    setStep('complete')

    const tg = window.Telegram?.WebApp
    const user = tg?.initDataUnsafe?.user

    try {
      const response = await createUser({
        telegram_id: user.id,
        username: user.username || undefined,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        exam_country: examCountry,
        exam_language: examLanguage,
        ui_language: uiLanguage
      })

      setInternalId(response.data.id)
      navigate('/home')
    } catch (err) {
      setError('Ошибка создания пользователя')
      console.error(err)
    }
  }

  if (step === 'checking') {
    return <div>Проверка данных...</div>
  }

  if (step === 'complete') {
    return <div>Регистрация завершена...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Дополнительная информация</h2>
      
      {/* Выпадающие списки */}
      <div style={{ margin: '10px 0' }}>
        <select
          value={examCountry}
          onChange={(e) => setExamCountry(e.target.value)}
        >
          <option value="">Выберите страну экзамена</option>
          {EXAM_COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div style={{ margin: '10px 0' }}>
        <select
          value={examLanguage}
          onChange={(e) => setExamLanguage(e.target.value)}
        >
          <option value="">Выберите язык экзамена</option>
          {EXAM_LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div style={{ margin: '10px 0' }}>
        <select
          value={uiLanguage}
          onChange={(e) => setUiLanguage(e.target.value)}
        >
          {UI_LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button onClick={handleSubmit}>Продолжить</button>
    </div>
  )
}

export default Authorize