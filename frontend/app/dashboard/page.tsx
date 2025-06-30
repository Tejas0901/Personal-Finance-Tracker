'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import ExpenseList from '@/components/expenses/ExpenseList'
import BudgetList from '@/components/budgets/BudgetList'
import SuggestionsPanel from '@/components/suggestions/SuggestionsPanel'
import Navigation from '@/components/layout/Navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    try {
      const user = JSON.parse(userData)
      setUser(user)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/')
      return
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'budgets', label: 'Budgets', icon: '📋' },
    { id: 'suggestions', label: 'Suggestions', icon: '💡' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />
      case 'expenses':
        return <ExpenseList />
      case 'budgets':
        return <BudgetList />
      case 'suggestions':
        return <SuggestionsPanel />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Track your expenses and manage your budget effectively
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
} 