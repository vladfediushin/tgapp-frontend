// frontend/src/pages/Profile.tsx
import React from 'react'
import { useSession } from '../store/session'
import { useNavigate } from 'react-router-dom'

console.log("Profile component mounted")

const Profile = () => {
  const userId = useSession(state => state.userId)
  const answers = useSession(state => state.answers)
  
  const navigate = useNavigate()
  const goHome = () => {
    navigate('/')
  }

  const correct = answers.filter(a => a.isCorrect).length
  const total = answers.length
  const streak = 1 // TODO: считать по дате, пока заглушка

  return (
    <div style={{ padding: 20 }}>
      <h2>Профиль пользователя</h2>
      <p>Ваш ID: {userId}</p>
      <p>Ответов всего: {total}</p>
      <p>Правильных: {correct}</p>
      <p>Текущий стрик: {streak} день</p>
      <button
        onClick={goHome}
        style={{
          marginTop: 20,
          padding: '12px',
          width: '100%',
          backgroundColor: '#2AABEE',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
        }}
      >
        На главную
      </button>
    </div>
  )
}

export default Profile