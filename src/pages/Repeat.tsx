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

  // Вместо “questions + step” заводим локальную очередь:
  const [queue, setQueue] = useState<QuestionOut[]>([])
  const [current, setCurrent] = useState<QuestionOut | null>(null)

  // Состояние из Zustand
  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  // 1) При первом рендере: сбрасываем локальные ответы и подгружаем вопросы
  useEffect(() => {
    resetAnswers()

    // Если вопросы переданы через `location.state`, то сразу в очередь
    if (preloadedQuestions) {
      setQueue(preloadedQuestions)
      return
    }

    if (!userId) {
      console.error('Repeat: нет userId, невозможно загрузить вопросы')
      return
    }

    // Запрашиваем вопросы с бэкенда
    getQuestions({
      user_id: userId,
      mode: mode,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
    })
      .then(res => {
        setQueue(res.data) // Инициализируем очередь
      })
      .catch(err => console.error('Ошибка загрузки вопросов:', err))
  }, [mode, preloadedQuestions, userId, resetAnswers])

  // 2) Следим, когда очередь изменилась: 
  //    если появились элементы, берем первый в качестве `current`,
  //    если очередь пустая — перенаправляем на /results
  useEffect(() => {
    if (queue.length > 0) {
      setCurrent(queue[0])
    } else {
      navigate('/results')
    }
  }, [queue, navigate])

  // 3) Обработчик нажатия на вариант ответа
  const handleAnswer = (index: number) => {
    if (!current) return
    const questionId = current.id
    const isCorrect = index === current.data.correct_index

    // Проверяем: первая ли это попытка для данного questionId
    const alreadyAnswered = answers.some(a => a.questionId === questionId)

    if (!alreadyAnswered) {
      // Первая попытка: сохраняем в Zustand и отправляем на бэкенд
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
    // Если alreadyAnswered === true, то это повторная попытка: 
    //   мы не зовём ни addAnswer(), ни submitAnswer()

    // 4) Составляем новую очередь:
    //    — убираем текущий вопрос (первый элемент)
    //    — если ответ неверный — ставим его в конец, иначе (если верный) — не возвращаем
    setQueue(prevQueue => {
      // prevQueue[0] === current
      const rest = prevQueue.slice(1) // все, кроме первого
      if (!isCorrect) {
        // на неверный ответ возвращаем этот вопрос в конец
        return [...rest, current]
      }
      // на правильный — просто убираем из очереди
      return rest
    })
  }

  // 5) Пока очередь ещё не загрузилась, показываем «Загрузка…»
  if (!current) {
    return <div style={{ padding: 20 }}>Загрузка вопросов...</div>
  }

  // 6) Рендер текущего вопроса
  return (
    <div style={{ padding: 20 }}>
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