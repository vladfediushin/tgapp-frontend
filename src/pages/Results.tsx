// frontend/src/pages/Results.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useTranslation } from 'react-i18next'

const Results: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const goHome = () => navigate('/')
  const answers = useSession(state => state.answers)

  const answersMap = new Map<number, typeof answers[0]>()
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
      <h2>{t('results.sessionComplete')}</h2>
      <p>{t('results.answeredCount', { count: uniqueAnswers.length })}</p>
      <p>{t('results.correctCount', { correct })}</p>
      <p>{t('results.incorrectCount', { incorrect })}</p>

      <button
        onClick={goHome}
        style={{
          marginTop: 20,
          padding: '12px',
          width: '100%',
          backgroundColor: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        {t('results.goHome')}
      </button>
    </div>
  )
}

export default Results