import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getQuestions, QuestionOut, submitAnswer } from '../api/api'

const Repeat: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const exam_country = useSession(state => state.examCountry)
  const exam_language = useSession(state => state.examLanguage)
  const mode = new URLSearchParams(location.search).get('mode') || 'interval'
  const { batchSize } = location.state
  const preloadedQuestions: QuestionOut[] | undefined = location.state?.questions

  // -------------------------------------------------------------------
  // 1) Состояния:
  // -------------------------------------------------------------------
  const [queue, setQueue] = useState<QuestionOut[] | null>(null)
  const [initialCount, setInitialCount] = useState<number | null>(null)
  const [current, setCurrent] = useState<QuestionOut | null>(null)

  // Новые состояния для обработки клика по ответу
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  // -------------------------------------------------------------------
  // 2) Вычисляем счетчики:
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
      country: exam_country,
      language: exam_language,
      batch_size: batchSize,
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

  // -------------------------------------------------------------------
  // 4) useEffect для установки текущего вопроса или навигации, когда очередь пуста:
  // -------------------------------------------------------------------
  useEffect(() => {
    if (queue === null) return

    if (queue.length > 0) {
      setCurrent(queue[0])
    } else {
      navigate('/results')
    }
  }, [queue, navigate])

  // -------------------------------------------------------------------
  // 5) Переход к следующему вопросу:
  // -------------------------------------------------------------------
  const nextQuestion = () => {
    setQueue(prevQueue => {
      if (!prevQueue) return prevQueue
      const [first, ...rest] = prevQueue
      // Если ответ был неправильным, добавляем вопрос в конец, иначе просто удаляем
      if (!isCorrect) {
        return [...rest, first]
      }
      return rest
    })
    // Сбрасываем состояние для нового вопроса
    setSelectedIndex(null)
    setIsAnswered(false)
    setIsCorrect(false)
  }

  // -------------------------------------------------------------------
  // 6) Обработчик ответа:
  // -------------------------------------------------------------------
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
    // если неправильный, ждем клика по "Далее"
  }

  // -------------------------------------------------------------------
  // 7) Пока очередь не загружена или текущего вопроса нет — показываем «Загрузка...»
  // -------------------------------------------------------------------
  if (queue === null || current === null) {
    return <div style={{ padding: 20 }}>Загрузка вопросов...</div>
  }

  // -------------------------------------------------------------------
  // 8) Основной рендер:
  // -------------------------------------------------------------------
  return (
    <div style={{ padding: 20 }}>
      {/* блок счетчиков */}
      <div style={{ marginBottom: 20 }}>
        <div>Всего вопросов в очереди (изначально): {initialCount}</div>
        <div>Осталось вопросов в очереди: {questionsLeft}</div>
        <div>Правильно отвечено: {correctCount}</div>
        <div>Неправильно отвечено: {incorrectCount}</div>
      </div>

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
        // стили кнопки
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

        // пытаемся достать URL из opt
        const maybeUrl = opt.replace(/[{\}]/g, '').trim()
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(maybeUrl)

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
            {isImage ? (
              <img
                src={maybeUrl}
                alt={`option ${idx + 1}`}
                style={{ maxWidth: '100px', height: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <span style={{ display: 'block', textAlign: 'left' }}>{opt}</span>
            )}
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

      <button
      onClick={() => navigate('/results')}
      style={{
        display: 'block',
        width: '100%',
        padding: '12px',
        marginTop: '20px',
        fontSize: '16px',
        backgroundColor: '#ccc',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      Назад
    </button>
    </div>
  )
}

export default Repeat
