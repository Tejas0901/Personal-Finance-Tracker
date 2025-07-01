'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import ChartsSection from './ChartsSection'

interface DashboardData {
  currentMonth: string
  totalSpending: number
  topCategory: {
    _id: string
    total: number
  } | null
  topPaymentMethods: Array<{
    _id: string
    count: number
    total: number
  }>
  categorySpending: Array<{
    _id: string
    total: number
  }>
  monthlyTrend: Array<{
    _id: {
      year: number
      month: number
    }
    total: number
  }>
  budgetAlerts: Array<{
    category: string
    budgetAmount: number
    currentSpending: number
    spendingPercentage: number
    alertType: string
  }>
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setData(response.data)
    } catch (error: any) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spending</p>
              <p className="text-2xl font-bold text-gray-900">₹{data.totalSpending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-gray-900">
                {data.topCategory ? data.topCategory._id : 'None'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{data.budgetAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Payment</p>
              <p className="text-lg font-bold text-gray-900">
                {data.topPaymentMethods[0]?._id || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <ChartsSection 
        categorySpending={data.categorySpending}
        monthlyTrend={data.monthlyTrend}
        topPaymentMethods={data.topPaymentMethods}
      />

      {/* Category Spending Summary */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Spending Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categorySpending.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{category._id}</span>
              <span className="text-primary-600 font-semibold">₹{category.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Alerts */}
      {data.budgetAlerts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Alerts</h3>
          <div className="space-y-3">
            {data.budgetAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.alertType === 'exceeded'
                    ? 'bg-danger-50 border-danger-200'
                    : 'bg-warning-50 border-warning-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.category}</h4>
                    <p className="text-sm text-gray-600">
                      Budget: ₹{alert.budgetAmount.toLocaleString()} | 
                      Spent: ₹{alert.currentSpending.toLocaleString()} 
                      ({alert.spendingPercentage.toFixed(1)}%)
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.alertType === 'exceeded'
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}
                  >
                    {alert.alertType === 'exceeded' ? 'Exceeded' : 'Warning'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 