// src/components/ExamSettingsComponent.tsx
import React, { useState, useEffect } from 'react'
import { useSession } from '../store/session'
import { getExamSettings, setExamSettings, ExamSettingsResponse, ExamSettingsUpdate } from '../api/api'

interface ExamSettingsComponentProps {
  showTitle?: boolean  // Whether to show the "Exam Settings" title
  onSave?: (settings: ExamSettingsResponse) => void  // Callback when settings are saved
  compact?: boolean    // Whether to use compact layout
}

const ExamSettingsComponent: React.FC<ExamSettingsComponentProps> = ({ 
  showTitle = true, 
  onSave,
  compact = false 
}) => {
  const userId = useSession(state => state.userId)
  
  const [settings, setSettingsState] = useState<ExamSettingsResponse | null>(null)
  const [examDate, setExamDate] = useState('')
  const [dailyGoal, setDailyGoal] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [userId])

  const loadSettings = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await getExamSettings(userId)
      setSettingsState(response.data)
      
      if (response.data.exam_date) {
        setExamDate(response.data.exam_date)
      }
      if (response.data.daily_goal) {
        setDailyGoal(response.data.daily_goal)
      }
    } catch (err) {
      console.error('Failed to load exam settings:', err)
      // Don't show error for missing settings (user hasn't set them yet)
      if (err.response?.status !== 404) {
        setError('Не удалось загрузить настройки экзамена')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userId) {
      setError('Пользователь не найден')
      return
    }

    // Allow saving even without exam date (optional)
    try {
      setSaving(true)
      setError(null)
      
      const updateData: ExamSettingsUpdate = {
        exam_date: examDate,
        daily_goal: dailyGoal
      }
      
      const response = await setExamSettings(userId, updateData)
      setSettingsState(response.data)
      
      // Call the callback if provided
      if (onSave) {
        onSave(response.data)
      }
      
    } catch (err: any) {
      console.error('Failed to save exam settings:', err)
      const errorMessage = err.response?.data?.detail || 'Ошибка сохранения настроек'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 1) // Tomorrow as minimum
    return today.toISOString().split('T')[0]
  }

  const containerStyle = {
    marginBottom: compact ? 16 : 24,
    padding: compact ? 12 : 0,
    backgroundColor: compact ? '#f8f9fa' : 'transparent',
    borderRadius: compact ? 8 : 0,
    border: compact ? '1px solid #e0e0e0' : 'none'
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ textAlign: 'center', color: '#666' }}>Загрузка настроек...</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {showTitle && (
        <h3 style={{ margin: `0 0 ${compact ? 12 : 16}px 0`, fontSize: compact ? 16 : 18 }}>
          Настройки экзамена (необязательно)
        </h3>
      )}
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 12,
          fontSize: compact ? 12 : 14
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: compact ? 12 : 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: compact ? 4 : 8, 
          fontWeight: '500',
          fontSize: compact ? 14 : 16
        }}>
          Дата экзамена:
        </label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          min={getTodayDate()}
          style={{
            width: '100%',
            padding: compact ? 8 : 12,
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: compact ? 14 : 16
          }}
        />
        {settings?.days_until_exam !== null && settings?.days_until_exam !== undefined && examDate && (
          <small style={{ color: '#666', marginTop: 4, display: 'block', fontSize: 12 }}>
            До экзамена: {settings.days_until_exam} дней
          </small>
        )}
      </div>

      <div style={{ marginBottom: compact ? 12 : 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: compact ? 4 : 8, 
          fontWeight: '500',
          fontSize: compact ? 14 : 16
        }}>
          Ежедневная цель: {dailyGoal} вопросов
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        {settings?.recommended_daily_goal && examDate && (
          <small style={{ color: '#666', marginTop: 4, display: 'block', fontSize: 12 }}>
            Рекомендуется: {settings.recommended_daily_goal} вопросов в день
          </small>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: compact ? 8 : 12,
          backgroundColor: saving ? '#ccc' : '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: compact ? 14 : 16,
          cursor: saving ? 'not-allowed' : 'pointer'
        }}
      >
        {saving ? 'Сохранение...' : 'Сохранить настройки'}
      </button>

      {settings?.exam_date && !compact && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#f0f8ff', 
          borderRadius: 6,
          border: '1px solid #e1f5fe'
        }}>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            📅 Дата экзамена: {new Date(settings.exam_date).toLocaleDateString('ru-RU')}
          </p>
          <p style={{ margin: '4px 0', fontSize: 14 }}>
            🎯 Ежедневная цель: {settings.daily_goal} вопросов
          </p>
          {settings.days_until_exam !== null && (
            <p style={{ margin: '4px 0', fontSize: 14 }}>
              ⏰ До экзамена: {settings.days_until_exam} дней
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ExamSettingsComponent