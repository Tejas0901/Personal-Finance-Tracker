'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import axios from 'axios'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        data
      )

      const { token, user } = response.data
      
      // Store token
      localStorage.setItem(
        process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'finance_tracker_token',
        token
      )
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(user))
      
      toast.success('Login successful!')
      router.push('/dashboard')
      
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="input-field"
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          className="input-field"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center text-sm text-gray-600">
        <p>Test Credentials:</p>
        <p className="font-mono text-xs mt-1">
          user@example.com / 123456
        </p>
        <p className="font-mono text-xs">
          admin@example.com / admin123
        </p>
      </div>
    </form>
  )
} 