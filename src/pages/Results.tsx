// frontend/src/pages/Results.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'

const Results = () => {
  const navigate = useNavigate()
  const goHome = () => {
    navigate('/')
  }
  const answers = useSession(state => state.answers)

  const answersMap = new Map<number, typeof answers[0]>()
  answers.forEach((a) => {
    if (!answersMap.has(a.questionId)) {
      answersMap.set(a.questionId, a)
    }
  })
  const uniqueAnswers = Array.from(answersMap.values())
  const correct = uniqueAnswers.filter(a => a.isCorrect).length
  const incorrectAnswers = uniqueAnswers.filter(a => !a.isCorrect)

  const handleRepeatIncorrect = async () => {
    try {
      const response = await fetch('http://localhost:8000/questions?mode=interval_all')
      const allQuestions = await response.json()
      const toRepeat = allQuestions.filter((q: any) =>
        incorrectAnswers.some((a) => a.questionId === q.id)
      )
      navigate('/repeat', { state: { questions: toRepeat } })
    } catch (err) {
      console.error('Ошибка при повторной загрузке вопросов', err)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Сессия завершена ✅</h2>
      <p>Вы ответили на {uniqueAnswers.length} вопросов.</p>
      <p>Правильных ответов: {correct}</p>
      <p>Неправильных: {uniqueAnswers.length - correct}</p>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 20,
          padding: '12px',
          width: '100%',
          backgroundColor: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
        }}
      >
        На главную
      </button>
    </div>
  )
}

export default Results