import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { updateUser } from '../api/api'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

const UI_LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

const Settings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const userId = useSession(state => state.userId)
  const uiLanguage = useSession(state => state.uiLanguage)
  const setUiLanguage = useSession(state => state.setUiLanguage)

  const handleBack = () => navigate('/profile')

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button 
          onClick={handleBack}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: 24, 
            cursor: 'pointer', 
            marginRight: 16,
            color: '#2AABEE'
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          {t('settings.title')}
        </h1>
      </div>

      <section style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', margin: '8px 0' }}>
          {t('settings.uiLanguageLabel')}
          <select
            value={uiLanguage}
            onChange={e => {
              const newUi = e.target.value
              setUiLanguage(newUi)
              i18n.changeLanguage(newUi)
              if (userId) {
                updateUser(userId, { ui_language: newUi }).catch(err =>
                  console.error('Ошибка обновления языка интерфейса:', err)
                )
              }
            }}
            style={{ 
              display: 'block', 
              marginTop: 8, 
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: 16
            }}
          >
            {UI_LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  )
}

export default Settings
