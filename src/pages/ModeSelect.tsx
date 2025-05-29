import React from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getQuestions, QuestionOut } from '../api/api'

const ModeSelect = () => {
  const navigate = useNavigate()

  const startMode = async (mode: string) => {
    if (mode === 'interval') {
      try {
        const response = await getQuestions({})
        console.log('Fetched interval questions:', response.data as QuestionOut[])
        // Здесь можно сохранить вопросы в глобальное состояние или передать дальше
      } catch (error) {
        console.error('Error fetching interval questions:', error)
      }
    }
    navigate(`/repeat?mode=${mode}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Выбери режим повторения</h2>

      <button onClick={() => startMode('interval')} style={btnStyle}>
        📆 Интервальные (по Фибоначчи)
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