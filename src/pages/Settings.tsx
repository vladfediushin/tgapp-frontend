import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession, updateUserAndCache } from '../store/session'
import { updateUser } from '../api/api'
import { useTranslation } from 'react-i18next'
import HomeButton from '../components/HomeButton'
import BottomNavigation from '../components/BottomNavigation'
import ExamSettingsComponent from '../components/ExamSettingsComponent'
import { Globe, ChevronDown, Calendar } from 'lucide-react'
import i18n from 'i18next'

const UI_LANGUAGES = [
  { value: 'ru', labelKey: 'languages.ru' },
  { value: 'en', labelKey: 'languages.en' },
  { value: 'hy', labelKey: 'languages.hy' },
]

const Settings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const userId = useSession(state => state.userId)
  const uiLanguage = useSession(state => state.uiLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)
  const cachedUser = useSession(state => state.cachedUser)
  const [showUiLanguageSelect, setShowUiLanguageSelect] = useState(false)
  const currentUiLanguage = UI_LANGUAGES.find(l => l.value === uiLanguage)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [reminderLoading, setReminderLoading] = useState(false)
  type ReminderKey = 'morning' | 'day' | 'evening'
  const [reminders, setReminders] = useState<Record<ReminderKey, boolean>>({
    morning: cachedUser?.remind_morning ?? false,
    day: cachedUser?.remind_day ?? false,
    evening: cachedUser?.remind_evening ?? false,
  })

  useEffect(() => {
    setReminders({
      morning: cachedUser?.remind_morning ?? false,
      day: cachedUser?.remind_day ?? false,
      evening: cachedUser?.remind_evening ?? false,
    })
  }, [cachedUser?.remind_morning, cachedUser?.remind_day, cachedUser?.remind_evening])

  const reminderOptions: { key: ReminderKey; label: string }[] = [
    { key: 'morning', label: t('settings.remindersMorning') },
    { key: 'day', label: t('settings.remindersDay') },
    { key: 'evening', label: t('settings.remindersEvening') },
  ]

  const handleReminderToggle = async (key: ReminderKey) => {
    if (!userId) return
    const nextValue = !reminders[key]
    setReminderError(null)
    setReminders(prev => ({ ...prev, [key]: nextValue }))
    setReminderLoading(true)
    try {
      await updateUserAndCache(userId, { [`remind_${key}`]: nextValue })
    } catch (error) {
      console.error('Failed to update reminders:', error)
      setReminders(prev => ({ ...prev, [key]: !nextValue }))
      setReminderError(t('settings.remindersUpdateError'))
    } finally {
      setReminderLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      paddingBottom: '80px' 
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px 24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <HomeButton />
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            {t('settings.title')}
          </h1>
        </div>
      </div>

      <div style={{ padding: '24px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Language Settings Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={20} color="#2563eb" />
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              {t('settings.uiLanguageCardTitle')}
            </h2>
          </div>

          <button
            onClick={() => setShowUiLanguageSelect(true)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {currentUiLanguage ? t(currentUiLanguage.labelKey) : t('profile.notSelected')}
            </span>
            <ChevronDown size={20} color="#6b7280" />
          </button>
          
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '12px 0 0 0'
          }}>
            {t('settings.uiLanguageDescription')}
          </p>
        </div>

        {/* Exam Settings Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} color="#d97706" />
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              {t('settings.examSettingsCardTitle')}
            </h2>
          </div>

          <ExamSettingsComponent 
            showTitle={false} 
            compact={true}
          />
        </div>

        {/* Reminder Settings Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
            {t('settings.remindersCardTitle')}
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
            {t('settings.remindersDescription')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reminderOptions.map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: reminders[option.key] ? '2px solid #059669' : '1px solid #e5e7eb',
                  backgroundColor: reminders[option.key] ? '#ecfdf5' : '#fff',
                  cursor: reminderLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => !reminderLoading && handleReminderToggle(option.key)}
              >
                <input
                  type="checkbox"
                  checked={reminders[option.key]}
                  readOnly
                  style={{ width: 20, height: 20 }}
                />
                <span style={{ fontWeight: 600, color: '#111827' }}>{option.label}</span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '12px 0 0 0' }}>
            {t('settings.remindersDisabledHint')}
          </p>
          {reminderError && (
            <p style={{ margin: '12px 0 0 0', color: '#dc2626', fontSize: '14px' }}>
              {reminderError}
            </p>
          )}
        </div>
      </div>

      <BottomNavigation />

      {showUiLanguageSelect && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => setShowUiLanguageSelect(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '12px 24px 16px',
              width: 'calc(100% - 40px)',
              maxWidth: '400px',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '20px',
                fontWeight: '600',
                textAlign: 'center',
                color: '#111827'
              }}
            >
              {t('settings.uiLanguageLabel')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {UI_LANGUAGES.map(l => (
                <button
                  key={l.value}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: l.value === uiLanguage ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    background: l.value === uiLanguage ? '#eff6ff' : '#fff',
                    fontWeight: l.value === uiLanguage ? '600' : '500',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onClick={() => {
                    setShowUiLanguageSelect(false)
                    setUiLanguage(l.value)
                    i18n.changeLanguage(l.value)
                    if (userId) {
                      updateUserAndCache(userId, { ui_language: l.value }).catch(err =>
                        console.error('Failed to update UI language:', err)
                      )
                    }
                  }}
                >
                  {t(l.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
