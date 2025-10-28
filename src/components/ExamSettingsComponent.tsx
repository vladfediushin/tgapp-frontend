// src/components/ExamSettingsComponent.tsx
import React, { useState, useEffect } from 'react'
import { useSession, setExamSettingsAndCache, loadRemainingCountWithCache } from '../store/session'
import { ExamSettingsResponse, ExamSettingsUpdate, api } from '../api/api'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const userId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)
  
  // Get initial values from session store - prioritize cachedUser, fallback to separate fields
  const cachedUser = useSession(state => state.cachedUser)
  const sessionExamDate = useSession(state => state.examDate)
  const sessionDailyGoal = useSession(state => state.manualDailyGoal)
  
  // Use cachedUser as primary source, fallback to session fields
  const primaryExamDate = cachedUser?.exam_date || sessionExamDate
  const primaryDailyGoal = cachedUser?.daily_goal || sessionDailyGoal
  
  // Исправляем типизацию useState для совместимости с React 19+
  const [settings, setSettingsState] = useState(null)
  const [examDate, setExamDate] = useState(primaryExamDate || '')
  const [dailyGoal, setDailyGoal] = useState(primaryDailyGoal || 10)
  const [recommendedGoal, setRecommendedGoal] = useState(null)
  const [remainingQuestions, setRemainingQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const formatDays = (value: number) => t('common.dayCount', { count: Math.max(value, 0) })

  useEffect(() => {
    loadSettings()
  }, [userId])

  // Дополнительное обновление при изменении session store
  // Это обеспечивает мгновенное отражение изменений из других частей приложения
  useEffect(() => {
    if (primaryExamDate !== null && primaryExamDate !== examDate) {
      console.log('🔄 Primary exam date changed, updating component:', primaryExamDate)
      setExamDate(primaryExamDate || '')
    }
  }, [primaryExamDate])
  
  useEffect(() => {
    if (primaryDailyGoal !== null && primaryDailyGoal !== dailyGoal) {
      console.log('🔄 Primary daily goal changed, updating component:', primaryDailyGoal, 'current:', dailyGoal)
      setDailyGoal(primaryDailyGoal)
    }
  }, [primaryDailyGoal])
  
  // Дополнительная синхронизация: обновляем состояние если данные из Session Store изменились
  useEffect(() => {
    console.log('📊 Session Store values changed:', { 
      cachedUserExamDate: cachedUser?.exam_date,
      cachedUserDailyGoal: cachedUser?.daily_goal,
      sessionExamDate, 
      sessionDailyGoal,
      primaryExamDate,
      primaryDailyGoal
    })
    if (primaryExamDate !== null) {
      setExamDate(primaryExamDate || '')
    }
    if (primaryDailyGoal !== null) {
      setDailyGoal(primaryDailyGoal)
    }
  }, [cachedUser?.exam_date, cachedUser?.daily_goal, sessionExamDate, sessionDailyGoal, primaryExamDate, primaryDailyGoal])

  useEffect(() => {
    // Пересчитываем рекомендуемое количество при изменении даты экзамена
    if (examDate && userId && examCountry && examLanguage) {
      calculateRecommendedGoal()
    }
  }, [examDate, userId, examCountry, examLanguage])

  const calculateRecommendedGoal = async () => {
    if (!examDate || !userId || !examCountry || !examLanguage) return

    try {
      // Получаем количество нерешенных вопросов с кешированием
      const remaining = await loadRemainingCountWithCache(userId, examCountry, examLanguage)
      setRemainingQuestions(remaining)

      // Рассчитываем рекомендуемое количество
      const today = new Date()
      const examDateObj = new Date(examDate)
      const totalDays = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (totalDays <= 0) {
        setRecommendedGoal(null)
        return
      }

      // 80% времени на изучение, 20% на повторение
      const studyDays = Math.floor(totalDays * 0.8)
      const recommended = studyDays > 0 ? Math.ceil(remaining / studyDays) : remaining
      
      setRecommendedGoal(recommended)
      
      // Всегда устанавливаем рекомендуемое значение по умолчанию
      setDailyGoal(recommended)
    } catch (err) {
      console.error('Failed to calculate recommended goal:', err)
    }
  }

  const loadSettings = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    // Сначала пробуем использовать данные из Session Store (приоритет cachedUser)
    if (primaryExamDate || primaryDailyGoal) {
      console.log('🎯 Using session store data for exam settings (cachedUser priority)')
      if (primaryExamDate) {
        setExamDate(primaryExamDate)
      }
      if (primaryDailyGoal) {
        setDailyGoal(primaryDailyGoal)
      }
      setLoading(false)
      return
    }
    
    // Fallback: загружаем с API, если Session Store пустой
    try {
      console.log('🔄 Session store empty, loading exam settings from API...')
      const response = await api.get<ExamSettingsResponse>(`/users/${userId}/exam-settings`)
      const settingsData = response.data
      
      setSettingsState(settingsData)
      
      if (settingsData.exam_date) {
        setExamDate(settingsData.exam_date)
      }
      if (settingsData.daily_goal) {
        setDailyGoal(settingsData.daily_goal)
      }
    } catch (err: any) {
      console.error('Failed to load exam settings:', err)
      // Don't show error for missing settings (user hasn't set them yet)
      if (err.response?.status !== 404) {
        setError(t('examSettings.errors.loadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userId) {
      setError(t('examSettings.errors.userNotFound'))
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
      
      const response = await setExamSettingsAndCache(userId, updateData)
      setSettingsState(response)
      
      // Call the callback if provided
      if (onSave) {
        onSave(response)
      }
      
    } catch (err: any) {
      console.error('Failed to save exam settings:', err)
      const errorMessage = err.response?.data?.detail || t('examSettings.errors.saveFailed')
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Преобразуем examDate к Date для DatePicker
  const examDateObj = examDate ? new Date(examDate) : null

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
        {t('examSettings.loading')}
      </div>
    )
  }

  const containerStyle = compact ? {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    width: '100%'
  } : {
    margin: '0 auto',
    maxWidth: 340,
    background: '#fff',
    borderRadius: 18,
    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
    padding: 24,
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 20,
  }

  return (
    <div style={containerStyle}>
      {showTitle && (
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
          {t('examSettings.title')}
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
          {t('examSettings.examDateLabel')}
        </label>
        <ReactDatePicker
          selected={examDateObj}
          onChange={date => setExamDate(date ? date.toISOString().split('T')[0] : '')}
          minDate={new Date()}
          dateFormat="dd/MM/yyyy"
          placeholderText={t('examSettings.chooseDatePlaceholder')}
          className="custom-datepicker-input"
          popperPlacement="bottom"
          showPopperArrow={false}
          wrapperClassName="custom-datepicker-wrapper"
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ width: '100%' }}>
        <label style={{ fontWeight: 500, fontSize: 16, marginBottom: 8, display: 'block' }}>
          {t('examSettings.dailyGoalLabel', { count: dailyGoal })}
        </label>
        {recommendedGoal && remainingQuestions !== null && (
          <div style={{
            fontSize: 13,
            color: '#666',
            marginBottom: 8,
            padding: 8,
            backgroundColor: '#f0f9ff',
            borderRadius: 6,
            border: '1px solid #0ea5e9'
          }}>
            💡 {t('examSettings.recommendationPrefix')}{' '}
            <strong>{t('examSettings.recommendationValue', { count: recommendedGoal })}</strong>
            <br />
            {t('examSettings.remainingQuestions', { count: remainingQuestions })}
            <br />
            {examDate && (() => {
              const today = new Date()
              const examDateObj = new Date(examDate)
              const totalDays = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (totalDays <= 0) {
                return null
              }
              const studyDays = Math.floor(totalDays * 0.8)
              const reviewDays = totalDays - studyDays
              return t('examSettings.studyPlan', {
                study: formatDays(studyDays),
                review: formatDays(reviewDays)
              })
            })()}
          </div>
        )}
        <input
          type="range"
          min="1"
          max="100"
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
        {saving ? t('examSettings.saving') : t('examSettings.save')}
      </button>
    </div>
  )
}

export default ExamSettingsComponent
