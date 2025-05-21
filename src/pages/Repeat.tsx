// frontend/src/pages/Repeat.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api, { submitAnswer } from '../api/api'
import { useSession } from '../store/session'

interface Question {
  id: number
  text: string
  image_url: string
  options: string[]
  correct_index: number
}

const Repeat = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = new URLSearchParams(location.search).get('mode') || 'interval'
  const preloadedQuestions: Question[] | undefined = location.state?.questions

  const [questions, setQuestions] = useState<Question[]>([])
  const [step, setStep] = useState(0)

  const userId = useSession(state => state.userId)
  const setUserId = useSession(state => state.setUserId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user?.id) {
      setUserId(tg.initDataUnsafe.user.id)
    }

    if (preloadedQuestions) {
      setQuestions(preloadedQuestions)
    } else {
      api.get(`/questions?mode=${mode}`)
        .then(res => setQuestions(res.data))
        .catch(err => console.error(err))
    }

    resetAnswers()
  }, [mode, preloadedQuestions, setUserId, resetAnswers])

  const handleAnswer = (index: number) => {
    const current = questions[step]
    const alreadyAnswered = answers.find(a => a.questionId === current.id)

    if (!alreadyAnswered) {
      const isCorrect = index === current.correct_index

      addAnswer({
        questionId: current.id,
        selectedIndex: index,
        isCorrect,
      })

      submitAnswer({
        user_id: userId,
        question_id: current.id,
        selected_index: index,
        is_correct: isCorrect,
      }).catch(err => {
        console.error('Ошибка отправки ответа:', err)
      })
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
      <img src={current.image_url} alt="question" style={{ maxWidth: '100%', borderRadius: '8px' }} />
      <p>{current.text}</p>

      {current.options.map((opt, idx) => (
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
            backgroundColor: '#fff'
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default Repeat