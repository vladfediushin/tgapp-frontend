// Working Profile.tsx - rebuilt from scratch
/// <reference path="../global.d.ts" />
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats } from '../api/api'
import { useTranslation } from 'react-i18next'

const Profile = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useSession(state => state.userId)
  
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    getUserStats(userId)
      .then(res => {
        setStats(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load profile data')
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка профиля...</div>
  }

  if (!userId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ color: 'red', marginBottom: 16 }}>
          Не удалось получить данные пользователя
        </div>
        <button onClick={() => navigate('/home')}>На главную</button>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ color: 'red', marginBottom: 16 }}>
          Ошибка: {error}
        </div>
        <button onClick={() => window.location.reload()}>Повторить</button>
        <button onClick={() => navigate('/home')} style={{ marginLeft: 10 }}>На главную</button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ padding: 20 }}>
        <div>Данные профиля недоступны</div>
        <button onClick={() => navigate('/home')}>На главную</button>
      </div>
    )
  }

  const { total_questions, answered, correct } = stats

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1>Профиль</h1>
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: 24 }}>
        <h3>Статистика</h3>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#888' }}>Всего вопросов</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{total_questions}</div>
          </div>
          <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#888' }}>Отвечено</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{answered}</div>
          </div>
          <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#888' }}>Правильно</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{correct}</div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/home')}
        style={{ 
          display: 'block', 
          width: '100%', 
          padding: '12px', 
          backgroundColor: '#2AABEE', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          fontSize: '16px', 
          cursor: 'pointer' 
        }}
      >
        На главную
      </button>
    </div>
  )
}

export default Profile
