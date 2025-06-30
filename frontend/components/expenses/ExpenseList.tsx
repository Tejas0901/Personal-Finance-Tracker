'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import ExpenseForm from './ExpenseForm'

interface Expense {
  _id: string
  amount: number
  category: string
  date: string
  paymentMethod: string
  notes?: string
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setExpenses(response.data.expenses)
    } catch (error: any) {
      toast.error('Failed to load expenses')
      console.error('Expenses error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpenseAdded = () => {
    setShowAddForm(false)
    fetchExpenses()
  }

  const handleExpenseUpdated = () => {
    setEditingExpense(null)
    fetchExpenses()
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    setDeletingExpense(expenseId)

    try {
      const token = localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token')
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/expenses/${expenseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error: any) {
      console.error('Delete expense error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete expense')
    } finally {
      setDeletingExpense(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No expenses found</p>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {expense.category.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{expense.category}</h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.paymentMethod}
                    </p>
                    {expense.notes && (
                      <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={() => handleEdit(expense)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(expense._id)}
                      disabled={deletingExpense === expense._id}
                      className="text-danger-600 hover:text-danger-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingExpense === expense._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <ExpenseForm
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
          onCancel={() => setEditingExpense(null)}
        />
      )}
    </div>
  )
} 