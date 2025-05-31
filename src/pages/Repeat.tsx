// frontend/src/pages/Repeat.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getQuestions, QuestionOut } from '../api/api'

const DEFAULT_COUNTRY = 'AM'
const DEFAULT_LANGUAGE = 'ru'

const Repeat: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = new URLSearchParams(location.search).get('mode') || 'interval'
  const preloadedQuestions: QuestionOut[] | undefined = location.state?.questions

  const [questions, setQuestions] = useState<QuestionOut[]>([])
  const [step, setStep] = useState(0)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  useEffect(() => {
    resetAnswers()

    if (preloadedQuestions) {
      setQuestions(preloadedQuestions)
      return
    }

    if (!userId) {
      console.error('Repeat: нет userId, невозможно загрузить вопросы')
      return
    }

    // Запрос с обязательными параметрами: user_id, mode, country, language
    getQuestions({
      user_id: userId,
      mode: mode,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
    })
      .then(res => setQuestions(res.data))
      .catch(err => console.error('Ошибка загрузки вопросов:', err))
  }, [mode, preloadedQuestions, userId, resetAnswers])

  const handleAnswer = (index: number) => {
    const current = questions[step]
    if (!current) return

    if (!answers.some(a => a.questionId === current.id)) {
      const isCorrect = index === current.data.correct_index
      addAnswer({ questionId: current.id, selectedIndex: index, isCorrect })
      // здесь можно вызвать submitAnswer
    }

    if (step + 1 < questions.length) {
      setStep(step + 1)
    } else {
      navigate('/results')
    }
  }

  if (questions.length === 0) {
    return <div style={{ padding: 20 }}>Загрузка вопросов...</div>
  }

  const current = questions[step]

  return (
    <div style={{ padding: 20 }}>
      <h2>Вопрос {step + 1}</h2>
      {current.data.question_image && (
        <img
          src={current.data.question_image}
          alt="question"
          style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
      )}
      <p>{current.data.question}</p>

      {current.data.options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => handleAnswer(idx)}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fff',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default Repeat