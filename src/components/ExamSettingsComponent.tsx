// src/components/ExamSettingsComponent.tsx
import React, { useState, useEffect } from 'react'
import { useSession } from '../store/session'
import { getExamSettings, setExamSettings, ExamSettingsResponse, ExamSettingsUpdate } from '../api/api'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface ExamSettingsComponentProps {
  showTitle?: boolean  // Whether to show the "Exam Settings" title
  onSave?: (settings: ExamSettingsResponse) => void  // Callback when settings are saved
  compact?: boolean    // Whether to use compact layout
}

// Вместо React.FC используем обычную функцию
function ExamSettingsComponent({ 
  showTitle = true, 
  onSave,
  compact = false 
}: ExamSettingsComponentProps) {
  const userId = useSession(state => state.userId)
  
  // Исправляем типизацию useState для совместимости с React 19+
  const [settings, setSettingsState] = useState(null)
  const [examDate, setExamDate] = useState('')
  const [dailyGoal, setDailyGoal] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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
        ...(examDate ? { exam_date: examDate } : {}),
        ...(dailyGoal !== undefined && dailyGoal !== null ? { daily_goal: dailyGoal } : {})
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

  // Преобразуем examDate к Date для DatePicker
  const examDateObj = examDate ? new Date(examDate) : null

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
    <div style={{
      margin: '0 auto',
      maxWidth: 340,
      background: '#fff',
      borderRadius: 18,
      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
      padding: 24,
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
    }}>
      {showTitle && (
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
          Настройки экзамена
        </h3>
      )}
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: 8, 
          borderRadius: 8, 
          marginBottom: 8,
          fontSize: 14,
          width: '100%',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
      <div style={{ width: '100%' }}>
        <label style={{ fontWeight: 500, fontSize: 16, marginBottom: 8, display: 'block' }}>
          Дата экзамена:
        </label>
        <ReactDatePicker
          selected={examDateObj}
          onChange={date => setExamDate(date ? date.toISOString().split('T')[0] : '')}
          minDate={new Date()}
          dateFormat="dd/MM/yyyy"
          placeholderText="Выберите дату"
          className="custom-datepicker-input"
          popperPlacement="bottom"
          showPopperArrow={false}
          wrapperClassName="custom-datepicker-wrapper"
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ width: '100%' }}>
        <label style={{ fontWeight: 500, fontSize: 16, marginBottom: 8, display: 'block' }}>
          Ежедневная цель: {dailyGoal} вопросов
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={dailyGoal}
          onChange={e => setDailyGoal(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: 14,
          background: saving ? '#ccc' : 'linear-gradient(90deg,#2AABEE 0%,#4F8EF7 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: 17,
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px 0 rgba(42,171,238,0.08)'
        }}
      >
        {saving ? 'Сохранение...' : 'Сохранить настройки'}
      </button>
    </div>
  )
}

export default ExamSettingsComponent