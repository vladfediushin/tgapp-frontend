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

  // 1) Инициализируем queue как null, чтобы отличать «ещё не загружали» от «загрузили, но пусто».
  const [queue, setQueue] = useState<QuestionOut[] | null>(null)
  const [current, setCurrent] = useState<QuestionOut | null>(null)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)

  // 2) При первом монтировании: сбрасываем старые ответы и либо берём preloadedQuestions, либо запрашиваем вопросы
  useEffect(() => {
    resetAnswers()

    if (preloadedQuestions) {
      // Если вопросы уже пришли через location.state, сразу кладём их в queue
      setQueue(preloadedQuestions)
      return
    }

    if (!userId) {
      console.error('Repeat: нет userId, невозможно загрузить вопросы')
      return
    }

    // Иначе отправляем запрос на бэкенд и, когда придёт ответ, заполняем queue
    getQuestions({
      user_id: userId,
      mode: mode,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
    })
      .then(res => {
        setQueue(res.data) // res.data — массив QuestionOut[]
      })
      .catch(err => {
        console.error('Ошибка загрузки вопросов:', err)
        // На случае ошибки можно в дальнейшем обработать либо перекинуть на какую-то ошибочную страницу.
        // Пока оставим queue = [] (если нужно сразу редиректить), либо можно оставить queue = [].
        setQueue([]) 
      })
  }, [mode, preloadedQuestions, userId, resetAnswers])

  // 3) Когда меняется queue, устанавливаем current или делаем редирект
  useEffect(() => {
    // Если queue всё ещё null — значит вопросы ещё не подгрузились → ждём
    if (queue === null) {
      return
    }

    if (queue.length > 0) {
      // Берём первый вопрос из очереди
      setCurrent(queue[0])
    } else {
      // Если после загрузки queue оказался пустым — идём на /results
      navigate('/results')
    }
  }, [queue, navigate])

  // 4) Обработчик ответа
  const handleAnswer = (index: number) => {
    if (!current) return
    const questionId = current.id
    const isCorrect = index === current.data.correct_index

    // Проверяем: была ли уже первая попытка для этого questionId
    const alreadyAnswered = answers.some(a => a.questionId === questionId)

    if (!alreadyAnswered) {
      // 4.1) Первая попытка: сохраняем локально и отправляем на бэкенд
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
    // Если это повторная попытка (alreadyAnswered === true), то ни addAnswer, ни submitAnswer не вызываем

    // 4.2) Теперь обновляем очередь:
    setQueue(prevQueue => {
      if (!prevQueue) return prevQueue // теоретически не должно быть, т.к. queue !== null здесь
      // Отсекаем первый элемент (current)
      const rest = prevQueue.slice(1)
      if (!isCorrect) {
        // Неверный ответ → возвращаем current в конец очереди
        return [...rest, current]
      }
      // Правильный ответ → просто убираем current (он не возвращается в очередь)
      return rest
    })
  }

  // 5) Пока queue === null (ещё не загрузились вопросы) или current === null (когда queue стал [] → navigate только что вызвался),
  //    показываем «Загрузка…». Когда queue стал [] навигация на /results произойдёт моментально.
  if (queue === null || current === null) {
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