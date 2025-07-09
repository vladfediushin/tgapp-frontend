// src/pages/Repeat.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getQuestions, QuestionOut, submitAnswer, getDailyProgress } from '../api/api'  // ДОБАВИЛ getDailyProgress
import { useTranslation } from 'react-i18next'

const Repeat: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const exam_country = useSession(state => state.examCountry)
  const exam_language = useSession(state => state.examLanguage)
  const mode = new URLSearchParams(location.search).get('mode') || 'interval_all'
  const { batchSize, selectedTopics = [] } = location.state || {}
  const preloadedQuestions: QuestionOut[] | undefined = location.state?.questions

  const [queue, setQueue] = useState<QuestionOut[] | null>(null)
  const [initialCount, setInitialCount] = useState<number | null>(null)
  const [current, setCurrent] = useState<QuestionOut | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)

  const userId = useSession(state => state.userId)
  const addAnswer = useSession(state => state.addAnswer)
  const resetAnswers = useSession(state => state.resetAnswers)
  const answers = useSession(state => state.answers)
  const setDailyProgress = useSession(state => state.setDailyProgress)  // ДОБАВИЛ

  const questionsLeft = queue !== null ? queue.length : 0
  const correctCount = answers.filter(a => a.isCorrect).length
  const incorrectCount = answers.filter(a => !a.isCorrect).length

  // Предзагрузка изображений следующего вопроса
  useEffect(() => {
    if (!queue?.length || queue.length < 2) return
    const next = queue[1]
    const preload = (url?: string) => {
      if (!url) return
      const img = new Image()
      img.src = url
    }
    preload(next.data.question_image)
    next.data.options?.forEach(opt => {
      const maybeUrl = String(opt).replace(/[{}]/g, '').trim()
      if (/(jpe?g|png|gif|webp)$/i.test(maybeUrl)) preload(maybeUrl)
    })
  }, [current, queue])

  useEffect(() => {
    resetAnswers()

    if (preloadedQuestions) {
      setQueue(preloadedQuestions)
      setInitialCount(preloadedQuestions.length)
      setCurrent(preloadedQuestions[0] || null)
      return
    }

    if (!userId) {
      console.error('Repeat: нет userId, невозможно загрузить вопросы')
      return
    }

    getQuestions({
      user_id: userId,
      mode,
      country: exam_country,
      language: exam_language,
      batch_size: batchSize,
      topic: selectedTopics.length > 0 ? selectedTopics : undefined,
    })
      .then(res => {
        setQueue(res.data)
        setInitialCount(res.data.length)
        setCurrent(res.data[0] || null)
      })
      .catch(err => {
        console.error('Ошибка загрузки вопросов:', err)
        setQueue([])
        setInitialCount(0)
        setCurrent(null)
      })
  }, [mode, preloadedQuestions, userId, resetAnswers, exam_country, exam_language, batchSize])

  const nextQuestion = (wasCorrect: boolean) => {
    setQueue(prevQueue => {
      if (!prevQueue) return prevQueue
      const [first, ...rest] = prevQueue
      const newQueue = wasCorrect ? rest : [...rest, first]
      const next = newQueue[0] || null
      setCurrent(next)
      if (!next) navigate('/results')
      return newQueue
    })
    setSelectedIndex(null)
    setIsAnswered(false)
  }

  const handleAnswer = async (index: number) => {  // ДОБАВИЛ async
    if (!current || isAnswered) return
    const questionId = current.id
    const correctIndex = current.data.correct_index
    const wasCorrect = index === correctIndex

    setSelectedIndex(index)
    setIsAnswered(true)
    setIsCorrect(wasCorrect)
    addAnswer({ questionId, selectedIndex: index, isCorrect: wasCorrect })

    if (userId) {
      try {
        await submitAnswer({ user_id: userId, question_id: questionId, is_correct: wasCorrect })
        console.log('submitAnswer success')
        
        // ДОБАВИЛ: Обновляем daily progress если ответ правильный
        if (wasCorrect) {
          const progressRes = await getDailyProgress(userId)
          setDailyProgress(progressRes.data.questions_mastered_today, progressRes.data.date)
        }
      } catch (err) {
        console.error('Ошибка при отправке ответа на бэк:', err)
      }
    }

    if (wasCorrect) {
      setTimeout(() => nextQuestion(true), 500)
    }
  }

  if (queue === null || current === null) {
    return <div style={{ padding: 20 }}>{t('repeat.loading')}</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <div>{t('repeat.statsInitial', { initialCount })}</div>
        <div>{t('repeat.statsLeft', { questionsLeft })}</div>
        <div>{t('repeat.statsCorrect', { correctCount })}</div>
        <div>{t('repeat.statsIncorrect', { incorrectCount })}</div>
      </div>

      <h2>{t('repeat.question')}</h2>
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
            backgroundColor = isCorrect ? 'green' : 'red'
            color = '#fff'
          } else if (!isCorrect && idx === current.data.correct_index) {
            backgroundColor = 'green'
            color = '#fff'
          }
        }

        const maybeUrl = opt.replace(/[{}]/g, '').trim()
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
          onClick={() => nextQuestion(false)}
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
          {t('repeat.next')}
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
        {t('repeat.back')}
      </button>
    </div>
  )
}

export default Repeat