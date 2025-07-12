// Minimal test profile page
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'

const ProfileTest = () => {
  const navigate = useNavigate()
  const userId = useSession(state => state.userId)

  console.log('ProfileTest - userId:', userId)

  return (
    <div style={{ padding: 20 }}>
      <h1>Profile Test Page</h1>
      <div>User ID: {userId || 'Not set'}</div>
      <button onClick={() => navigate('/home')}>Back to Home</button>
      <div style={{ marginTop: 20, padding: 20, background: '#f0f0f0' }}>
        <p>This is a test version of the profile page.</p>
        <p>If you see this content, the routing and basic rendering works.</p>
      </div>
    </div>
  )
}

export default ProfileTest
