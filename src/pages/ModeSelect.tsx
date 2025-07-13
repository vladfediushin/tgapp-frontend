// src/pages/ModeSelect.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Settings, Brain, X, Check } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'

const ModeSelect = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const topics = useSession(state => state.topics)

  const [mode, setMode] = useState('interval_all')
  const [batchSize, setBatchSize] = useState(30)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState([])

  const handleNext = () => {
    const realMode = selectedTopics.length > 0 ? 'topics' : mode
    const params = new URLSearchParams({
      mode: realMode,
      batchSize: String(batchSize),
    })
    selectedTopics.forEach(topic => params.append('topic', topic))
    navigate(
      `/repeat?${params.toString()}`,
      { state: { batchSize, selectedTopics } }
    )
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const modeOptions = [
    { id: 'interval_all', icon: '🔄', color: 'blue' },
    { id: 'new_only', icon: '✨', color: 'green' },
    { id: 'incorrect', icon: '❌', color: 'red' }
  ]

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
          
          <button
            onClick={() => setShowTopicsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <Brain size={16} className="text-blue-600" />
            <span className="font-medium text-gray-700">
              {selectedTopics.length > 0 
                ? `${selectedTopics.length} ${t('modeSelect.topicsSelected')}`
                : t('modeSelect.topicsAll')
              }
            </span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-lg flex items-center justify-center">
            <Settings size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('modeSelect.title')}</h1>
          <p className="text-gray-600">{t('modeSelect.subtitle')}</p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4 mb-8">
          {modeOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setMode(option.id)}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                mode === option.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  mode === option.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <span className="text-xl">{option.icon}</span>
                </div>
                <div className="text-left flex-1">
                  <h3 className={`font-semibold text-lg ${
                    mode === option.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {t(`modeSelect.modes.${option.id}`)}
                  </h3>
                  <p className="text-gray-600 text-sm">{t(`modeSelect.modes.${option.id}_desc`)}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  mode === option.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {mode === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Batch Size */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t('modeSelect.batchSize')}: <span className="text-blue-600">{batchSize}</span>
          </h3>
          <input
            type="range"
            min={1}
            max={50}
            value={batchSize}
            onChange={e => setBatchSize(+e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Play size={20} />
          {t('modeSelect.next')}
        </button>
      </div>

      {/* Topics Modal */}
      {showTopicsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('modeSelect.modal.title')}</h3>
              <button
                onClick={() => setShowTopicsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {[...topics]
                .sort((a, b) => {
                  const numA = parseInt(a.match(/\d+/)?.[0] || '', 10)
                  const numB = parseInt(b.match(/\d+/)?.[0] || '', 10)
                  if (!isNaN(numA) && !isNaN(numB)) return numA - numB
                  return a.localeCompare(b, 'ru')
                })
                .map(topic => (
                  <label 
                    key={topic} 
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{topic}</span>
                  </label>
                ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTopicsModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} />
                {t('modeSelect.modal.cancel')}
              </button>
              <button
                onClick={() => {
                  setMode('topics')
                  setShowTopicsModal(false)
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {t('modeSelect.modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}

export default ModeSelect
