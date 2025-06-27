// src/pages/ModeSelect.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useTranslation } from 'react-i18next'

const ModeSelect: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const topics = useSession(state => state.topics)

  const [mode, setMode] = useState<string>('interval_all')
  const [batchSize, setBatchSize] = useState<number>(30)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const handleNext = () => {
    const realMode = selectedTopics.length > 0 ? 'topics' : mode
    const params = new URLSearchParams({
      mode: realMode,
      batchSize: String(batchSize),
    })
    selectedTopics.forEach(topic => params.append('topic', topic))
    navigate(
      `/repeat?${params.toString()}`,
      { state: { batchSize, selectedTopics } }
    )
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('modeSelect.title')}</h2>
        <button
          onClick={() => setShowTopicsModal(true)}
          style={{
            fontSize: 14,
            backgroundColor: '#eee',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          🧠 {t('modeSelect.topics', {
            count: selectedTopics.length > 0
              ? selectedTopics.length
              : t('modeSelect.topicsAll')
          })}
        </button>
      </div>

      {['interval_all', 'new_only', 'shown_before'].map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            marginTop: '10px',
            fontSize: '16px',
            backgroundColor: mode === m ? '#e0f2ff' : '#f3f3f3',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          {t(`modeSelect.modes.${m}`)}
        </button>
      ))}

      <div style={{ marginTop: 20 }}>
        <label>
          {t('modeSelect.batchSize')}: {batchSize}
          <input
            type="range"
            min={1}
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
          display: 'block',
          width: '100%',
          padding: '12px',
          marginTop: '30px',
          fontSize: '16px',
          backgroundColor: '#2AABEE',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {t('modeSelect.next')}
      </button>

      <button
        onClick={() => navigate('/home')}
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
        {t('modeSelect.back')}
      </button>

      {showTopicsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '400px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            <h3>{t('modeSelect.modal.title')}</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[...topics]
                .sort((a, b) => {
                  const numA = parseInt(a.match(/\d+/)?.[0] || '', 10)
                  const numB = parseInt(b.match(/\d+/)?.[0] || '', 10)
                  if (!isNaN(numA) && !isNaN(numB)) return numA - numB
                  return a.localeCompare(b, 'ru')
                })
                .map(topic => (
                  <label key={topic} style={{ display: 'block', margin: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                    />
                    {topic}
                  </label>
                ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
              <button
                title={t('modeSelect.modal.cancel')}
                onClick={() => setShowTopicsModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '18px',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c2c7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                🛑
              </button>
              <button
                title={t('modeSelect.modal.confirm')}
                onClick={() => {
                  setMode('topics')
                  setShowTopicsModal(false)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '18px',
                  backgroundColor: '#d1e7dd',
                  border: '1px solid #badbcc',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModeSelect
