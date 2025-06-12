import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ModeSelect: React.FC = () => {
  const navigate = useNavigate()

  const [mode, setMode] = useState<string>('interval_all')
  const [batchSize, setBatchSize] = useState<number>(30)

  const handleNext = () => {
    // Переходим, передаём batchSize и режим
    navigate(
      `/repeat?mode=${mode}&batchSize=${batchSize}`,
      { state: { batchSize } }
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Выбери режим повторения</h2>

      {['interval_all', 'new_only', 'shown_before', 'topics'].map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{
            ...btnStyle,
            backgroundColor: mode === m ? '#e0f2ff' : undefined,
          }}
        >
          {{
            interval_all: '📆 Интервальные (по Фибоначчи)',
            new_only:      '🆕 Только новые',
            shown_before:    '❌ Только ошибочные',
            topics:   '📚 По темам',
          }[m]}
        </button>
      ))}

      <div style={{ marginTop: 20 }}>
        <label>
          Размер партии: {batchSize}
          <input
            type="range"
            min={20}
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

export default ModeSelect
