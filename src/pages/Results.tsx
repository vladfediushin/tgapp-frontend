// frontend/src/pages/Results.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useTranslation } from 'react-i18next'
import { Trophy, CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'

const Results = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const answers = useSession(state => state.answers)
  const location = window.location
  const state = (location as any).state || {}

  // Try to get state from react-router if available
  let noQuestions = false
  try {
    // @ts-ignore
    if (window.history.state && window.history.state.usr && window.history.state.usr.noQuestions) {
      noQuestions = true
    }
  } catch {}

  // Fallback for react-router v6
  if (typeof window !== 'undefined' && window.history && window.history.state && window.history.state.usr) {
    noQuestions = window.history.state.usr.noQuestions || false
  }

  const answersMap = new Map<string, typeof answers[0]>()
  answers.forEach(a => {
    if (!answersMap.has(a.questionId)) {
      answersMap.set(a.questionId, a)
    }
  })
  const uniqueAnswers = Array.from(answersMap.values())
  const correct = uniqueAnswers.filter(a => a.isCorrect).length
  const incorrect = uniqueAnswers.length - correct
  const percentage = uniqueAnswers.length > 0 ? Math.round((correct / uniqueAnswers.length) * 100) : 0

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return t('results.excellent')
    if (percentage >= 80) return t('results.good')
    if (percentage >= 60) return t('results.fair')
    return t('results.needsImprovement')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 p-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t('common.back')}</span>
          </button>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 mb-6">
          {/* Trophy Icon */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-lg flex items-center justify-center">
              <Trophy size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('results.sessionComplete')}</h1>
            <p className="text-gray-600">{getScoreMessage()}</p>
          </div>

          {noQuestions ? (
            <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-semibold text-lg">{t('results.noQuestions')}</p>
            </div>
          ) : (
            <>
              {/* Score Circle */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${percentage * 2.83} 283`}
                      className={`transition-all duration-1000 ${
                        percentage >= 80 ? 'text-green-500' :
                        percentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor()}`}>{percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{uniqueAnswers.length}</div>
                  <div className="text-sm text-gray-600">{t('results.total')}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{correct}</div>
                  </div>
                  <div className="text-sm text-gray-600">{t('results.correct')}</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle size={16} className="text-red-600" />
                    <div className="text-2xl font-bold text-red-600">{incorrect}</div>
                  </div>
                  <div className="text-sm text-gray-600">{t('results.incorrect')}</div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/mode-select')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              <RotateCcw size={20} />
              {t('results.tryAgain')}
            </button>
            
            {incorrect > 0 && (
              <button
                onClick={() => navigate('/repeat', { state: { mode: 'incorrect' } })}
                className="w-full bg-red-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-3"
              >
                <XCircle size={18} />
                {t('results.reviewIncorrect')}
              </button>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Results