'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Suggestion {
  type: 'warning' | 'advice' | 'tip' | 'positive' | 'info'
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface Analysis {
  totalSpending: number
  averageDailySpending: number
  topCategory: string
  message: string
}

export default function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/suggestions`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setSuggestions(response.data.suggestions)
      setAnalysis(response.data.analysis)
    } catch (error: any) {
      toast.error('Failed to load suggestions')
      console.error('Suggestions error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️'
      case 'advice':
        return '💡'
      case 'tip':
        return '💡'
      case 'positive':
        return '✅'
      case 'info':
        return 'ℹ️'
      default:
        return '💡'
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-warning-200 bg-warning-50'
      case 'advice':
        return 'border-primary-200 bg-primary-50'
      case 'tip':
        return 'border-success-200 bg-success-50'
      case 'positive':
        return 'border-success-200 bg-success-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Smart Suggestions</h2>
        <button 
          onClick={fetchSuggestions}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Spending (30 days)</p>
              <p className="text-2xl font-bold text-gray-900">₹{analysis.totalSpending.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">₹{analysis.averageDailySpending.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Top Category</p>
              <p className="text-2xl font-bold text-gray-900">{analysis.topCategory}</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No suggestions available</p>
          <p className="text-sm text-gray-400">Start tracking your expenses to get personalized suggestions!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getSuggestionColor(suggestion.type)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getSuggestionIcon(suggestion.type)}</span>
                <div className="flex-1">
                  <p className="text-gray-900">{suggestion.message}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        suggestion.priority === 'high'
                          ? 'bg-danger-100 text-danger-800'
                          : suggestion.priority === 'medium'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-success-100 text-success-800'
                      }`}
                    >
                      {suggestion.priority} priority
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {suggestion.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 General Tips</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <span className="text-success-600">•</span>
            <p className="text-gray-700">Track every expense, no matter how small</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-success-600">•</span>
            <p className="text-gray-700">Set realistic budgets for each category</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-success-600">•</span>
            <p className="text-gray-700">Review your spending patterns regularly</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-success-600">•</span>
            <p className="text-gray-700">Look for opportunities to reduce recurring expenses</p>
          </div>
        </div>
      </div>
    </div>
  )
} 