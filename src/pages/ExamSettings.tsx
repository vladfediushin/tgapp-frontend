import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ExamSettingsComponent from '../components/ExamSettingsComponent'

const ExamSettings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleSave = () => {
    // Navigate back to profile after saving
    navigate('/profile')
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            marginRight: 16,
            padding: 0,
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {t('examSettings.title')}
        </h1>
      </div>

      {/* Exam Settings Component */}
      <ExamSettingsComponent 
        showTitle={false} 
        compact={false} 
        onSave={handleSave} 
      />
    </div>
  )
}

export default ExamSettings
