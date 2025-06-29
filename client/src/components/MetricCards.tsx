import type React from "react"
import { useAppSelector } from "../store/hooks"
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react"

const MetricCards: React.FC = () => {
  const { stats } = useAppSelector((state) => state.transactions)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
                <div className="h-8 bg-slate-700 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      title: "Balance",
      value: formatCurrency(stats.balance || 0),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue || 0),
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Expenses",
      value: formatCurrency(stats.totalExpenses || 0),
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Savings",
      value: formatCurrency(stats.savings || 0),
      icon: PiggyBank,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div key={metric.title} className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MetricCards
