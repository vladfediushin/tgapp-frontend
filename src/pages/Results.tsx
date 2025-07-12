// frontend/src/pages/Results.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useTranslation } from 'react-i18next'
import HomeButton from '../components/HomeButton'

const Results = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const answers = useSession(state => state.answers)
  const location = window.location
  const state = (location as any).state || {}

  // Try to get state from react-router if available
  let noQuestions = false
  try {
    // @ts-ignore
    if (window.history.state && window.history.state.usr && window.history.state.usr.noQuestions) {
      noQuestions = true
    }
  } catch {}

  // Fallback for react-router v6
  if (typeof window !== 'undefined' && window.history && window.history.state && window.history.state.usr) {
    noQuestions = window.history.state.usr.noQuestions || false
  }

  const answersMap = new Map<string, typeof answers[0]>()
  answers.forEach(a => {
    if (!answersMap.has(a.questionId)) {
      answersMap.set(a.questionId, a)
    }
  })
  const uniqueAnswers = Array.from(answersMap.values())
  const correct = uniqueAnswers.filter(a => a.isCorrect).length
  const incorrect = uniqueAnswers.length - correct

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <HomeButton style={{ marginRight: 16 }} />
        <h2 style={{ margin: 0 }}>{t('results.sessionComplete')}</h2>
      </div>
      {noQuestions && (
        <p style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>
          {t('results.noQuestions')}
        </p>
      )}
      <p>{t('results.answeredCount', { count: uniqueAnswers.length })}</p>
      <p>{t('results.correctCount', { correct })}</p>
      <p>{t('results.incorrectCount', { incorrect })}</p>
    </div>
  )
}

export default Results