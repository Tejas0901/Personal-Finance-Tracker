'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import BudgetForm from './BudgetForm'

interface Budget {
  _id: string
  category: string
  amount: number
  month: string
  currentSpending: number
  spendingPercentage: number
  alertStatus: string
  alertThreshold: number
  isActive: boolean
}

export default function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<string | null>(null)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setBudgets(response.data.budgets)
    } catch (error: any) {
      toast.error('Failed to load budgets')
      console.error('Budgets error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBudgetAdded = () => {
    setShowAddForm(false)
    fetchBudgets()
  }

  const handleBudgetUpdated = () => {
    setEditingBudget(null)
    fetchBudgets()
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return
    }

    setDeletingBudget(budgetId)

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/budgets/${budgetId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      toast.success('Budget deleted successfully')
      fetchBudgets()
    } catch (error: any) {
      console.error('Delete budget error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete budget')
    } finally {
      setDeletingBudget(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-danger-600 bg-danger-100'
      case 'warning':
        return 'text-warning-600 bg-warning-100'
      default:
        return 'text-success-600 bg-success-100'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No budgets set</p>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {budget.category.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                    <p className="text-sm text-gray-600">Month: {budget.month}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₹{budget.currentSpending.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(budget.alertStatus)}`}>
                      {budget.spendingPercentage.toFixed(1)}%
                    </span>
                    <button 
                      onClick={() => handleEdit(budget)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(budget._id)}
                      disabled={deletingBudget === budget._id}
                      className="text-danger-600 hover:text-danger-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingBudget === budget._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      budget.alertStatus === 'exceeded'
                        ? 'bg-danger-500'
                        : budget.alertStatus === 'warning'
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.min(budget.spendingPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <BudgetForm
          onBudgetAdded={handleBudgetAdded}
          onBudgetUpdated={handleBudgetUpdated}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingBudget && (
        <BudgetForm
          budget={editingBudget}
          onBudgetAdded={handleBudgetAdded}
          onBudgetUpdated={handleBudgetUpdated}
          onCancel={() => setEditingBudget(null)}
        />
      )}
    </div>
  )
} 