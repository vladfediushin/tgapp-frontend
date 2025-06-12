import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'

const ModeSelect: React.FC = () => {
  const navigate = useNavigate()
  const topics = useSession(state => state.topics)

  const [mode, setMode] = useState<string>('interval_all')
  const [batchSize, setBatchSize] = useState<number>(30)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const handleNext = () => {
    const params = new URLSearchParams({ mode, batchSize: String(batchSize) })
    if (mode === 'topics' && selectedTopics.length) {
      selectedTopics.forEach(topic => params.append('topic', topic))
    }
    navigate(`/repeat?${params.toString()}`, { state: { batchSize, selectedTopics } })
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Выбери режим повторения</h2>

      {['interval_all', 'new_only', 'shown_before', 'topics'].map(m => (
        <button
          key={m}
          onClick={() => {
            if (m === 'topics') {
              setShowTopicsModal(true)
            } else {
              setMode(m)
            }
          }}
          style={{
            ...btnStyle,
            backgroundColor: mode === m ? '#e0f2ff' : undefined,
          }}
        >
          {{
            interval_all: 'Все вопросы',
            new_only: 'Только новые',
            shown_before: 'Только показанные раньше',
            topics: `Темы: ${
              selectedTopics.length > 0 ? selectedTopics.length : 'все'
            }`,
          }[m]}
        </button>
      ))}

      <div style={{ marginTop: 20 }}>
        <label>
          Размер партии: {batchSize}
          <input
            type="range"
            min={10}
            max={50}
            value={batchSize}
            onChange={e => setBatchSize(+e.target.value)}
            style={{ width: '100%', marginTop: 8 }}
          />
        </label>
      </div>

      <button
        onClick={handleNext}
        style={{
          ...btnStyle,
          marginTop: 30,
          backgroundColor: '#2AABEE',
          color: '#fff',
          border: 'none',
        }}
      >
        Далее
      </button>

      {showTopicsModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3>Выберите темы</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {topics.map(topic => (
                <label key={topic} style={{ display: 'block', margin: '4px 0' }}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                  />{' '}
                  {topic}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button onClick={() => setShowTopicsModal(false)} style={btnStyle}>
                Отмена
              </button>
              <button
                onClick={() => {
                  setMode('topics')
                  setShowTopicsModal(false)
                }}
                style={{ ...btnStyle, marginLeft: '8px', backgroundColor: '#2AABEE', color: '#fff', border: 'none' }}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '10px',
  fontSize: '16px',
  backgroundColor: '#f3f3f3',
  border: '1px solid #ccc',
  borderRadius: '8px',
  textAlign: 'left',
  cursor: 'pointer',
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '80%',
  maxWidth: '400px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
}

export default ModeSelect