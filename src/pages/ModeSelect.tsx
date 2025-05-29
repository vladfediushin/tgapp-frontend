import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuestions, QuestionOut } from '../api/api'

const ModeSelect = () => {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuestionOut[]>([])
  const [loading, setLoading] = useState(false)

  const startMode = async (mode: string) => {
    if (mode === 'interval') {
      setLoading(true)
      try {
        const response = await getQuestions()
        setQuestions(response.data)
        // Передаём вопросы в состояние навигации
        navigate(`/repeat?mode=${mode}`, { state: { questions: response.data } })
        return
      } catch (error) {
        console.error('Ошибка при загрузке вопросов:', error)
      } finally {
        setLoading(false)
      }
    }

    // Для остальных режимов просто переходим без предзагрузки
    navigate(`/repeat?mode=${mode}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Выбери режим повторения</h2>

      <button
        onClick={() => startMode('interval')}
        disabled={loading}
        style={btnStyle}
      >
        📆 Интервальные (по Фибоначчи){loading ? ' (Загрузка...)' : ''}
      </button>
      <button onClick={() => startMode('new')} style={btnStyle}>
        🆕 Только новые
      </button>
      <button onClick={() => startMode('wrong')} style={btnStyle}>
        ❌ Только ошибочные
      </button>
      <button onClick={() => startMode('topics')} style={btnStyle}>
        📚 По темам
      </button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '10px',
  fontSize: '16px',
  backgroundColor: '#f3f3f3',
  border: '1px solid #ccc',
  borderRadius: '8px',
}

export default ModeSelect
