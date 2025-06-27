// frontend/src/pages/Topics.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const topics = ['Знаки', 'Светофоры', 'Разметка', 'Ситуации', 'Парковка']

const Topics: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const goHome = () => {
    navigate('/')
  }

  const handleSelect = (topic: string) => {
    navigate('/repeat', { state: { topic } })
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{t('topics.title')}</h2>
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => handleSelect(topic)}
          style={{
            display: 'block',
            width: '100%',
            margin: '10px 0',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          {t(`topics.list.${topic}`)}
        </button>
      ))}
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
        {t('topics.goHome')}
      </button>
    </div>
  )
}

export default Topics