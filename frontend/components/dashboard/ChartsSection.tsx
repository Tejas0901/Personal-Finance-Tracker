'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface CategorySpending {
  _id: string
  total: number
}

interface MonthlyTrend {
  _id: {
    year: number
    month: number
  }
  total: number
}

interface PaymentMethod {
  _id: string
  count: number
  total: number
}

interface ChartsSectionProps {
  categorySpending: CategorySpending[]
  monthlyTrend: MonthlyTrend[]
  topPaymentMethods: PaymentMethod[]
}

function ChartsSection({ categorySpending, monthlyTrend, topPaymentMethods }: ChartsSectionProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Color palette for pie chart
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
    '#84CC16', // lime
    '#6366F1', // indigo
  ]

  // Memoize calculations to prevent unnecessary re-renders
  const insights = useMemo(() => {
    const totalSpending = categorySpending.reduce((sum, cat) => sum + cat.total, 0)
    const topCategory = categorySpending[0]
    const topCategoryPercentage = totalSpending > 0 ? ((topCategory?.total || 0) / totalSpending * 100).toFixed(1) : '0'
    
    const recentMonths = monthlyTrend.slice(-3)
    const trendDirection = recentMonths.length >= 2 
      ? recentMonths[recentMonths.length - 1].total > recentMonths[recentMonths.length - 2].total 
        ? 'increasing' 
        : 'decreasing'
      : 'stable'
    
    return { totalSpending, topCategory, topCategoryPercentage, trendDirection }
  }, [categorySpending, monthlyTrend])

  const { totalSpending, topCategory, topCategoryPercentage, trendDirection } = insights

  // Memoize chart data
  const pieChartData = useMemo(() => ({
    labels: categorySpending.map(cat => cat._id),
    datasets: [
      {
        data: categorySpending.map(cat => cat.total),
        backgroundColor: colors.slice(0, categorySpending.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }), [categorySpending])

  const lineChartData = useMemo(() => ({
    labels: monthlyTrend.map(item => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return `${monthNames[item._id.month - 1]} ${item._id.year}`;
    }),
    datasets: [
      {
        label: 'Total Spending',
        data: monthlyTrend.map(item => item.total),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  }), [monthlyTrend])

  // Memoize chart options
  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  }), [])

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Spending: ₹${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + Number(value).toLocaleString();
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }), [])

  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Spending Distribution</h3>
          <div className="chart-container">
            <div className="text-center text-gray-500">
              <p>Loading chart...</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h3>
          <div className="chart-container">
            <div className="text-center text-gray-500">
              <p>Loading chart...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart - Category Spending */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Spending Distribution</h3>
          <div className="chart-container">
            {categorySpending.length > 0 ? (
              <Pie
                data={pieChartData}
                options={pieChartOptions}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Chart - Monthly Spending Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h3>
          <div className="chart-container">
            {monthlyTrend.length > 0 ? (
              <Line
                data={lineChartData}
                options={lineChartOptions}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods Chart */}
      {topPaymentMethods.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPaymentMethods.map((method, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{method._id}</span>
                  <span className="text-sm text-gray-500">{method.count} transactions</span>
                </div>
                <div className="text-2xl font-bold text-primary-600">₹{method.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  {totalSpending > 0 ? ((method.total / totalSpending) * 100).toFixed(1) : '0'}% of total spending
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Summary */}
      {categorySpending.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Spending Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">₹{totalSpending.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Spending</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{topCategory?._id || 'None'}</div>
              <div className="text-sm text-gray-600">Top Category ({topCategoryPercentage}%)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600 capitalize">{trendDirection}</div>
              <div className="text-sm text-gray-600">Spending Trend</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(ChartsSection) 