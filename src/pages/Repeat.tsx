// frontend/src/pages/Repeat.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getQuestions, QuestionOut, submitAnswer } from '../api/api'

const DEFAULT_COUNTRY = 'AM'
const DEFAULT_LANGUAGE = 'ru'

const Repeat: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = new URLSearchParams(location.search).get('mode') || 'interval'
  const preloadedQuestions: QuestionOut[] | undefined = location.state?.questions

  // -------------------------------------------------------------------
  // 1) Состояния:
  // -------------------------------------------------------------------
  const [queue, setQueue] = useState<QuestionOut[] | null>(null)
  const [initialCount, setInitialCount] = useState<number | null>(null) // <-- новое состояние
  const [current, setCurrent] = useState<QuestionOut | null>(null)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  // -------------------------------------------------------------------
  // 2) Вычисляем динамическое "сколько вопросов осталось" и счётчики правильных/неправильных:
  // -------------------------------------------------------------------
  const questionsLeft = queue !== null ? queue.length : 0
  const correctCount = answers.filter(a => a.isCorrect).length
  const incorrectCount = answers.filter(a => !a.isCorrect).length

  // -------------------------------------------------------------------
  // 3) useEffect для загрузки вопросов и установки initialCount:
  // -------------------------------------------------------------------
  useEffect(() => {
    resetAnswers()

    if (preloadedQuestions) {
      setQueue(preloadedQuestions)

      // <-- сохраняем изначальную длину, если еще не было установлено
      if (initialCount === null) {
        setInitialCount(preloadedQuestions.length)
      }
      return
    }

    if (!userId) {
      console.error('Repeat: нет userId, невозможно загрузить вопросы')
      return
    }

    getQuestions({
      user_id: userId,
      mode: mode,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
    })
      .then(res => {
        setQueue(res.data)

        // <-- сохраняем изначальную длину при первом вызове
        if (initialCount === null) {
          setInitialCount(res.data.length)
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки вопросов:', err)
        setQueue([])

        // <-- если загрузка упала, тоже устанавливаем initialCount = 0 один раз
        if (initialCount === null) {
          setInitialCount(0)
        }
      })
  }, [mode, preloadedQuestions, userId, resetAnswers, initialCount])

  // -------------------------------------------------------------------
  // 4) useEffect для установки текущего вопроса или навигации, когда очередь пуста:
  // -------------------------------------------------------------------
  useEffect(() => {
    if (queue === null) {
      return
    }

    if (queue.length > 0) {
      setCurrent(queue[0])
    } else {
      navigate('/results')
    }
  }, [queue, navigate])

  // -------------------------------------------------------------------
  // 5) Обработчик ответа:
  // -------------------------------------------------------------------
  const handleAnswer = (index: number) => {
    if (!current) return
    const questionId = current.id
    const isCorrect = index === current.data.correct_index

    const alreadyAnswered = answers.some(a => a.questionId === questionId)

    if (!alreadyAnswered) {
      addAnswer({ questionId, selectedIndex: index, isCorrect })

      if (userId) {
        submitAnswer({
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
        })
          .then(response => {
            console.log('submitAnswer success:', response.data)
          })
          .catch(err => {
            console.error('Ошибка при отправке ответа на бэк:', err)
          })
      } else {
        console.error('Repeat: нет userId, не отправляем submitAnswer')
      }
    }

    setQueue(prevQueue => {
      if (!prevQueue) return prevQueue
      const rest = prevQueue.slice(1)
      if (!isCorrect) {
        return [...rest, current]
      }
      return rest
    })
  }

  // -------------------------------------------------------------------
  // 6) Пока очередь не загружена или текущего вопроса нет — показываем «Загрузка...»
  // -------------------------------------------------------------------
  if (queue === null || current === null) {
    return <div style={{ padding: 20 }}>Загрузка вопросов...</div>
  }

  // -------------------------------------------------------------------
  // 7) Основной рендер: здесь queue !== null и current !== null гарантированно
  // -------------------------------------------------------------------
  return (
    <div style={{ padding: 20 }}>
      {/* ---------- блок счётчиков ---------- */}
      <div style={{ marginBottom: 20 }}>
        <div>Всего вопросов в очереди (изначально): {initialCount}</div>
        <div>Осталось вопросов в очереди: {questionsLeft}</div>
        <div>Правильно отвечено: {correctCount}</div>
        <div>Неправильно отвечено: {incorrectCount}</div>
      </div>
      {/* ------------------------------------ */}

      <h2>Вопрос</h2>
      {current.data.question_image && (
        <img
          src={current.data.question_image}
          alt="question"
          style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
      )}
      <p style={{ fontSize: 18, margin: '12px 0' }}>{current.data.question}</p>

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
            textAlign: 'left',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default Repeat