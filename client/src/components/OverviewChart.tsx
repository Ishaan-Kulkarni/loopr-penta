import type React from "react"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { fetchChartData } from "../store/slices/transactionSlice"

// Updated CustomTooltip Component to match the screenshot
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    // This tooltip is designed to show only for the 'income' line as per the screenshot.
    const data = payload.find((pld: any) => pld.dataKey === 'income');

    if (!data) return null;

    return (
      <div className="bg-green-500 text-white rounded-lg px-4 py-2 shadow-lg text-center">
        <div className="text-xs text-white/80 mb-1">Income</div>
        <div className="text-lg font-bold">${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    );
  }

  return null;
};


const OverviewChart: React.FC = () => {
  const dispatch = useAppDispatch()
  const { chartData, isLoading } = useAppSelector((state) => state.transactions)
  const [period, setPeriod] = useState("monthly")

  // Fetch chart data when component mounts or period changes
  useEffect(() => {
    dispatch(fetchChartData(period))
  }, [dispatch, period])

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value
    setPeriod(newPeriod)
  }

  const formatXAxisLabel = (value: string) => {
    switch (period) {
      case "weekly":
        return value
      case "yearly":
        return value
      case "monthly":
      default:
        return value
    }
  }

  const formatYAxisLabel = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value}`
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Overview</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Expenses</span>
          </div>
          <select 
            value={period}
            onChange={handlePeriodChange}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatXAxisLabel}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisLabel}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#4ade80', strokeWidth: 2, strokeDasharray: '3 3' }}
                position={{ y: -20 }} // Adjust vertical position of the tooltip container
                wrapperStyle={{ zIndex: 10 }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22C55E"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: "#fff", 
                  strokeWidth: 2, 
                  fill: "#22C55E",
                }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EAB308"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: "#fff", 
                  strokeWidth: 2, 
                  fill: "#EAB308",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default OverviewChart