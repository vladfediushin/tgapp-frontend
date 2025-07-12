// Simplified Profile.tsx for debugging
/// <reference path="../global.d.ts" />
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { getUserStats } from '../api/api'

const ProfileSimple = () => {
  const navigate = useNavigate()
  const userId = useSession(state => state.userId)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log('ProfileSimple render - userId:', userId, 'loading:', loading, 'stats:', stats)

  useEffect(() => {
    console.log('ProfileSimple useEffect - userId:', userId)
    
    if (!userId) {
      console.log('No userId, setting loading to false')
      setLoading(false)
      return
    }

    console.log('Fetching stats for userId:', userId)
    setLoading(true)
    setError(null)

    getUserStats(userId)
      .then(res => {
        console.log('Stats fetched successfully:', res.data)
        setStats(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching stats:', err)
        setError(err.message || 'Failed to fetch stats')
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    console.log('Rendering loading state')
    return (
      <div style={{ padding: 20 }}>
        <h1>Profile Simple</h1>
        <div>Loading...</div>
      </div>
    )
  }

  if (!userId) {
    console.log('Rendering no userId state')
    return (
      <div style={{ padding: 20 }}>
        <h1>Profile Simple</h1>
        <div style={{ color: 'red' }}>No user ID available</div>
        <button onClick={() => navigate('/home')}>Back to Home</button>
      </div>
    )
  }

  if (error) {
    console.log('Rendering error state')
    return (
      <div style={{ padding: 20 }}>
        <h1>Profile Simple</h1>
        <div style={{ color: 'red' }}>Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  console.log('Rendering main content state')
  return (
    <div style={{ padding: 20 }}>
      <h1>Profile Simple - SUCCESS!</h1>
      <div>User ID: {userId}</div>
      {stats && (
        <div style={{ marginTop: 20, padding: 10, background: '#f0f0f0' }}>
          <h3>Stats:</h3>
          <div>Total Questions: {stats.total_questions}</div>
          <div>Answered: {stats.answered}</div>
          <div>Correct: {stats.correct}</div>
        </div>
      )}
      <button onClick={() => navigate('/home')} style={{ marginTop: 20 }}>
        Back to Home
      </button>
    </div>
  )
}

export default ProfileSimple
