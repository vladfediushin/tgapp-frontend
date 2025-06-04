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

  const [queue, setQueue] = useState<QuestionOut[] | null>(null)
  const [initialCount, setInitialCount] = useState<number | null>(null)
  const [current, setCurrent] = useState<QuestionOut | null>(null)

  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  const questionsLeft = queue !== null ? queue.length : 0
  const correctCount = answers.filter(a => a.isCorrect).length
  const incorrectCount = answers.filter(a => !a.isCorrect).length

  // 1) Загрузка вопросов и установка initialCount
  useEffect(() => {
    resetAnswers()

    if (preloadedQuestions) {
      setQueue(preloadedQuestions)
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
        if (initialCount === null) {
          setInitialCount(res.data.length)
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки вопросов:', err)
        setQueue([])
        if (initialCount === null) {
          setInitialCount(0)
        }
      })
  }, [mode, preloadedQuestions, userId, resetAnswers, initialCount])

  // 2) При изменении queue — устанавливаем current и сбрасываем состояния
  useEffect(() => {
    if (queue === null) return

    if (queue.length > 0) {
      setCurrent(queue[0])
      setIsImageLoaded(false)
      setSelectedIndex(null)
      setIsAnswered(false)
      setIsCorrect(false)
    } else {
      navigate('/results')
    }
  }, [queue, navigate])

  // 3) Прелоад следующего изображения, когда текущее загрузилось
  useEffect(() => {
    if (isImageLoaded && queue && queue.length > 1) {
      const nextImgUrl = queue[1].data.question_image
      if (nextImgUrl) {
        const img = new Image()
        img.src = nextImgUrl
        // img.onload можно использовать для логов, но не обязательно
      }
    }
  }, [isImageLoaded, queue])

  // 4) Переход к следующему вопросу
  const nextQuestion = () => {
    setQueue(prevQueue => {
      if (!prevQueue) return prevQueue
      const [first, ...rest] = prevQueue
      if (!isCorrect) {
        return [...rest, first]
      }
      return rest
    })
    // После изменения queue сработает второй useEffect,
    // который сбросит isImageLoaded и другие флаги
  }

  // 5) Обработчик клика по варианту
  const handleAnswer = (index: number) => {
    if (!current || isAnswered) return

    const questionId = current.id
    const correctIndex = current.data.correct_index
    const wasCorrect = index === correctIndex

    setSelectedIndex(index)
    setIsAnswered(true)
    setIsCorrect(wasCorrect)
    addAnswer({ questionId, selectedIndex: index, isCorrect: wasCorrect })

    if (userId) {
      submitAnswer({
        user_id: userId,
        question_id: questionId,
        is_correct: wasCorrect,
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

    if (wasCorrect) {
      setTimeout(() => {
        nextQuestion()
      }, 500)
    }
    // Если неправильный, ждём нажатия кнопки "Далее"
  }

  // 6) Пока queue или current не готовы — показываем "Загрузка..."
  if (queue === null || current === null) {
    return <div style={{ padding: 20 }}>Загрузка вопросов...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Счётчики */}
      <div style={{ marginBottom: 20 }}>
        <div>Всего вопросов в очереди (изначально): {initialCount}</div>
        <div>Осталось вопросов в очереди: {questionsLeft}</div>
        <div>Правильно отвечено: {correctCount}</div>
        <div>Неправильно отвечено: {incorrectCount}</div>
      </div>

      {/* Если изображение не загрузилось — показываем плейсхолдер */}
      {!isImageLoaded ? (
        <div style={{ padding: 20, textAlign: 'center' }}>
          Загрузка изображения...
        </div>
      ) : (
        // Когда isImageLoaded = true — рендерим вопрос целиком
        <>
          <h2>Вопрос</h2>
          {current.data.question_image && (
            <img
              src={current.data.question_image}
              alt="question"
              style={{ maxWidth: '100%', borderRadius: '8px' }}
            />
          )}
          <p style={{ fontSize: 18, margin: '12px 0' }}>{current.data.question}</p>

          {current.data.options.map((opt, idx) => {
            let backgroundColor = '#fff'
            let color = '#000'

            if (isAnswered) {
              if (idx === selectedIndex) {
                if (isCorrect) {
                  backgroundColor = 'green'
                  color = '#fff'
                } else {
                  backgroundColor = 'red'
                  color = '#fff'
                }
              } else if (!isCorrect && idx === current.data.correct_index) {
                backgroundColor = 'green'
                color = '#fff'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  margin: '10px 0',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  backgroundColor,
                  color,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                }}
              >
                {opt}
              </button>
            )
          })}

          {isAnswered && !isCorrect && (
            <button
              onClick={nextQuestion}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Далее
            </button>
          )}
        </>
      )}

      {/* Скрытое изображение для отслеживания onLoad */}
      {current.data.question_image && (
        <img
          src={current.data.question_image}
          alt="hidden-loader"
          style={{ display: 'none' }}
          onLoad={() => setIsImageLoaded(true)}
        />
      )}
    </div>
  )
}

export default Repeat