import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useStatsStore } from '../store/stats'
import { loadStatsWithCache } from '../utils/statsSync'
import { useTranslation } from 'react-i18next'
import HomeButton from '../components/HomeButton'
import BottomNavigation from '../components/BottomNavigation'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock,
  Award,
  Activity,
  HelpCircle,
  X
} from 'lucide-react'

const Statistics = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const userId = useSession(state => state.userId)
  const examCountry = useSession(state => state.examCountry)
  const examLanguage = useSession(state => state.examLanguage)

  // Stats store hooks
  const userStats = useStatsStore(state => state.userStats)
  const isStatsLoading = useStatsStore(state => state.isStatsLoading)

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBoxesInfo, setShowBoxesInfo] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Load from cache or API
    loadStatsWithCache(userId)
      .then(({ userStats, fromCache }) => {
        setStats(userStats)
        setError(null)
        if (fromCache) {
          console.log('📦 Using cached stats in Statistics')
        } else {
          console.log('🔄 Loaded fresh stats in Statistics')
        }
      })
      .catch(err => {
        console.error('Error loading statistics:', err)
        setError('Failed to load statistics')
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return <LoadingSpinner size={64} fullScreen />
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          color: '#dc2626',
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {t('common.errorWithMessage', { message: error })}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            {t('buttons.retry')}
          </button>
          <button 
            onClick={() => navigate('/home')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            {t('buttons.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ 
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {t('statistics.unavailable')}
        </div>
        <button 
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer'
          }}
        >
          {t('buttons.backToHome')}
        </button>
      </div>
    )
  }

  const { total_questions, answered, correct, box_counts } = stats
  const unanswered = total_questions - answered
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
  const completionRate = total_questions > 0 ? Math.round((answered / total_questions) * 100) : 0
  const MAX_BOXES = 10
  const normalizedBoxCounts = Array.from({ length: MAX_BOXES }, (_, idx) => box_counts?.[idx] ?? 0)

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
        {t('statistics.title')}
      </h1>
        </div>
      </div>

      <div style={{ padding: '24px', gap: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {/* Accuracy */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Target size={24} color="#059669" />
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {accuracy}%
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {t('statistics.accuracy')}
            </p>
          </div>

          {/* Completion Rate */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <BarChart3 size={24} color="#f59e0b" />
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {completionRate}%
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {t('statistics.studyProgress')}
            </p>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            {t('statistics.detailedStats')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Total Questions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={20} color="#3730a3" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 2px 0'
                }}>
                  {t('statistics.totalQuestions')}
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>
                  {total_questions}
                </p>
              </div>
            </div>

            {/* Answered */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
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
                <Clock size={20} color="#d97706" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 2px 0'
                }}>
                  {t('statistics.answered')}
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>
                  {answered}
                </p>
              </div>
            </div>

            {/* Unanswered */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={20} color="#6b7280" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 2px 0'
                }}>
                  {t('statistics.unanswered')}
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  margin: 0
                }}>
                  {unanswered}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Box Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              {t('statistics.boxDistribution')}
            </h3>
            <button
              onClick={() => setShowBoxesInfo(true)}
              aria-label={t('statistics.boxInfoTitle')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <HelpCircle size={22} />
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {normalizedBoxCounts.map((count, idx) => (
              <div key={idx} style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {t('statistics.boxLabel', { num: idx + 1 })}
                </span>
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            {t('statistics.visualProgress')}
          </h3>
          
          <div style={{
            width: '100%',
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            height: '8px',
            marginBottom: '8px'
          }}>
            <div 
              style={{
                backgroundColor: '#059669',
                height: '8px',
                borderRadius: '9999px',
                transition: 'all 1s ease-out',
                width: `${completionRate}%`
              }}
            />
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
            textAlign: 'center'
          }}>
            {t('statistics.completionSummary', { percent: completionRate, unanswered })}
          </p>
        </div>
      </div>

      <BottomNavigation />

      {showBoxesInfo && (
        <div
          onClick={() => setShowBoxesInfo(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
            }}
          >
            <button
              onClick={() => setShowBoxesInfo(false)}
              aria-label={t('common.close')}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827' }}>
              {t('statistics.boxInfoTitle')}
            </h3>
            <p style={{ color: '#374151', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              {t('statistics.boxInfoParagraph1')}
            </p>
            <p style={{ color: '#374151', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {t('statistics.boxInfoParagraph2')}
            </p>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
              {t('statistics.boxInfoHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics
