// frontend/src/pages/Topics.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'

const topics = ['Знаки', 'Светофоры', 'Разметка', 'Ситуации', 'Парковка']

const Topics = () => {
  const navigate = useNavigate()
  const goHome = () => {
    navigate('/')
  }

  const handleSelect = (topic: string) => {
    navigate('/repeat', { state: { topic } })
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Выберите тему</h2>
      {topics.map((t, i) => (
        <button
          key={i}
          onClick={() => handleSelect(t)}
          style={{
            display: 'block',
            width: '100%',
            margin: '10px 0',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        >
          {t}
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
        }}
      >
        На главную
      </button>
    </div>
  )
}

export default Topics