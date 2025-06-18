import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats, UserStats, getQuestions, QuestionOut } from '../api/api'

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
    // fetch aggregated stats
    getUserStats(userId)
      .then(res => setStats(res.data))
      .catch(err => console.error('Ошибка получения статистики:', err))
      .finally(() => setLoading(false))
    // fetch count of questions ready for repeat
    getQuestions({ user_id: userId, mode: 'interval', country: examCountry, language: examLanguage })
      .then(res => setDueCount(res.data.length))
      .catch(err => console.error('Ошибка получения повторных вопросов:', err))
  }, [userId, examCountry, examLanguage])

  const handleBack = () => navigate('/home')

  if (loading || stats === null || dueCount === null) {
    return <div style={{ padding: 20 }}>Загрузка профиля...</div>
  }

  const { total_questions, answered, correct } = stats
  const incorrect = answered - correct
  const unanswered = total_questions - answered

  return (
    <div style={{ padding: 20 }}>
      <h2>Профиль пользователя</h2>

      {/* Настройки */}
      <section style={{ marginBottom: 24 }}>
        <h3>Настройки</h3>
        <label style={{ display: 'block', margin: '8px 0' }}>
          Страна экзамена
          <select
            value={examCountry}
            onChange={e => setExamCountry(e.target.value)}
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
          Язык экзамена
          <select
            value={examLanguage}
            onChange={e => setExamLanguage(e.target.value)}
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
          Язык интерфейса
          <select
            value={uiLanguage}
            onChange={e => setUiLanguage(e.target.value)}
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
        <h3>Статистика</h3>
        <div>Всего вопросов: {total_questions}</div>
        <div>Отвечено: {answered}</div>
        <div>Верных ответов: {correct}</div>
        <div>Ошибочных ответов: {incorrect}</div>
        <div>Неотвеченных вопросов: {unanswered}</div>
        <div>Готовы к повторению: {dueCount}</div>
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
        Назад
      </button>
    </div>
  )
}

export default Profile
