// src/pages/Repeat.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getQuestions, QuestionOut, submitAnswer } from '../api/api'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, XCircle, Target, BarChart3 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { updateStatsOptimistically } from '../utils/statsSync'

const Repeat = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const exam_country = useSession(state => state.examCountry)
  const exam_language = useSession(state => state.examLanguage)
  const mode = new URLSearchParams(location.search).get('mode') || 'interval_all'
  const { batchSize, selectedTopics = [] } = location.state || {}
  const preloadedQuestions = location.state?.questions

  const [queue, setQueue] = useState(null)
  const [initialCount, setInitialCount] = useState(null)
  const [current, setCurrent] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

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
      if (preloadedQuestions.length === 0) {
        navigate('/results', { state: { noQuestions: true } })
        return
      }
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
        if (res.data.length === 0) {
          navigate('/results', { state: { noQuestions: true } })
          return
        }
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

  const handleAnswer = async (index: number) => {
    if (!current || isAnswered) return
    const questionId = current.id
    const correctIndex = current.data.correct_index
    const wasCorrect = index === correctIndex

    setSelectedIndex(index)
    setIsAnswered(true)
    setIsCorrect(wasCorrect)
    addAnswer({ questionId, selectedIndex: index, isCorrect: wasCorrect })

    // Optimistic update for immediate UI feedback
    if (wasCorrect) {
      updateStatsOptimistically(1, 1)
    }

    if (userId) {
      try {
        await submitAnswer({ user_id: userId, question_id: questionId, is_correct: wasCorrect })
        console.log('submitAnswer success')
      } catch (err) {
        console.error('Ошибка при отправке ответа на бэк:', err)
      }
    }

    if (wasCorrect) {
      setTimeout(() => nextQuestion(true), 500)
    }
  }

  if (queue === null || current === null) {
    return <LoadingSpinner size={64} text={t('repeat.loading')} fullScreen />
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '16px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => navigate('/results')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6'
              e.target.style.color = '#111827'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#6b7280'
            }}
          >
            <ArrowLeft size={20} />
            <span style={{ fontWeight: '500' }}>{t('repeat.back')}</span>
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={20} style={{ color: '#059669' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#059669'
            }}>
              {questionsLeft} {t('repeat.statsLeft').replace('{questionsLeft}', '')}
            </span>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
              {initialCount}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Всего
            </div>
          </div>
          <div style={{
            backgroundColor: '#ecfdf5',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
              {correctCount}
            </div>
            <div style={{ fontSize: '12px', color: '#059669' }}>
              Верных
            </div>
          </div>
          <div style={{
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
              {incorrectCount}
            </div>
            <div style={{ fontSize: '12px', color: '#dc2626' }}>
              Ошибок
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          margin: 0
        }}>
          {t('repeat.question')}
        </h2>
        
        {current.data.question_image && (
          <div style={{ marginBottom: '16px' }}>
            <img
              src={current.data.question_image}
              alt="question"
              style={{ 
                width: '100%', 
                maxWidth: '400px',
                height: 'auto',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        )}
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.5',
          color: '#374151',
          margin: '0 0 20px 0'
        }}>
          {current.data.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {current.data.options.map((opt, idx) => {
            let backgroundColor = 'white'
            let borderColor = '#d1d5db'
            let color = '#374151'
            
            if (isAnswered) {
              if (idx === selectedIndex) {
                if (isCorrect) {
                  backgroundColor = '#ecfdf5'
                  borderColor = '#059669'
                  color = '#059669'
                } else {
                  backgroundColor = '#fef2f2'
                  borderColor = '#dc2626'
                  color = '#dc2626'
                }
              } else if (!isCorrect && idx === current.data.correct_index) {
                backgroundColor = '#ecfdf5'
                borderColor = '#059669'
                color = '#059669'
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
                  width: '100%',
                  padding: '16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '12px',
                  backgroundColor,
                  color,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!isAnswered) {
                    e.target.style.borderColor = '#6b7280'
                    e.target.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnswered) {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.backgroundColor = 'white'
                  }
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isAnswered && (idx === selectedIndex || (!isCorrect && idx === current.data.correct_index)) 
                    ? (idx === selectedIndex && isCorrect) || (!isCorrect && idx === current.data.correct_index) 
                      ? '#059669' 
                      : '#dc2626'
                    : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isAnswered && (idx === selectedIndex || (!isCorrect && idx === current.data.correct_index)) ? (
                    (idx === selectedIndex && isCorrect) || (!isCorrect && idx === current.data.correct_index) ? (
                      <CheckCircle size={16} style={{ color: 'white' }} />
                    ) : (
                      <XCircle size={16} style={{ color: 'white' }} />
                    )
                  ) : (
                    <span style={{ 
                      color: '#6b7280', 
                      fontSize: '12px', 
                      fontWeight: 'bold' 
                    }}>
                      {idx + 1}
                    </span>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  {isImage ? (
                    <img
                      src={maybeUrl}
                      alt={`option ${idx + 1}`}
                      style={{ 
                        maxWidth: '120px', 
                        height: 'auto', 
                        borderRadius: '8px',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <span style={{ 
                      fontSize: '15px',
                      lineHeight: '1.4',
                      fontWeight: '500'
                    }}>
                      {opt}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {isAnswered && !isCorrect && (
          <button
            onClick={() => nextQuestion(false)}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb'
            }}
          >
            {t('repeat.next')}
          </button>
        )}
      </div>
    </div>
  )
}

export default Repeat