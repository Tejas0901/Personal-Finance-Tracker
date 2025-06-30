'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Budget {
  _id: string
  category: string
  amount: number
  month: string
  alertThreshold: number
  isActive: boolean
}

interface BudgetFormProps {
  budget?: Budget | null
  onBudgetAdded: () => void
  onBudgetUpdated: () => void
  onCancel: () => void
}

export default function BudgetForm({ budget, onBudgetAdded, onBudgetUpdated, onCancel }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    alertThreshold: '80',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare',
    'Education', 'Housing', 'Utilities', 'Insurance', 'Travel', 'Gifts', 'Other'
  ]

  // Load budget data if editing
  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
        month: budget.month,
        alertThreshold: budget.alertThreshold.toString(),
        isActive: budget.isActive
      })
    }
  }, [budget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || !formData.amount || !formData.month) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      const requestData = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold),
        isActive: formData.isActive
      }

      if (budget) {
        // Update existing budget
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/budgets/${budget._id}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        toast.success('Budget updated successfully')
        onBudgetUpdated()
      } else {
        // Create new budget
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/budgets`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        toast.success('Budget added successfully')
        onBudgetAdded()
      }
    } catch (error: any) {
      console.error('Budget operation error:', error)
      toast.error(error.response?.data?.message || `Failed to ${budget ? 'update' : 'add'} budget`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const isEditing = !!budget

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Budget' : 'Add New Budget'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter budget amount"
              required
            />
          </div>

          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month *
            </label>
            <input
              type="month"
              id="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="alertThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Alert Threshold (%) *
            </label>
            <select
              id="alertThreshold"
              name="alertThreshold"
              value={formData.alertThreshold}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="70">70%</option>
              <option value="80">80%</option>
              <option value="90">90%</option>
              <option value="100">100%</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Budget
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Budget' : 'Add Budget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 