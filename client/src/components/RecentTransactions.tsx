import type React from "react"
import { useAppSelector } from "../store/hooks"
import type { RootState } from "../store"
import type { Transaction } from "../types"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const RecentTransactions: React.FC = () => {
  const { recentTransactions } = useAppSelector((state: RootState) => state.transactions)

  const formatCurrency = (amount: number, category: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

    return category === "Revenue" ? `+${formatted}` : `-${formatted}`
  }

  const getTransactionType = (category: string) => {
    return category === "Revenue" ? "Received from" : "Sent to"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white">Recent Transactions</h3>
        <button className="text-green-400 hover:text-green-300 text-sm font-semibold transition-colors">
          See all
        </button>
      </div>
      
      <div className="space-y-4">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction: Transaction) => (
            <div key={transaction.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  {transaction.user_profile ? (
                    <img
                      src={transaction.user_profile}
                      alt={transaction.user_id}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        ;(target.nextElementSibling as HTMLElement)!.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-white text-sm font-bold"
                    style={{ display: transaction.user_profile ? 'none' : 'flex' }}
                  >
                    {getInitials(transaction.user_id)}
                  </span>
                </div>
                
                {/* Transaction type indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                  transaction.category === "Revenue" 
                    ? 'bg-green-500' 
                    : 'bg-amber-500'
                }`}>
                  {transaction.category === "Revenue" ? (
                    <ArrowDownRight className="h-3 w-3 text-white" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{getTransactionType(transaction.category)}</p>
                <p className="text-sm font-semibold text-white truncate">{transaction.user_id}</p>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    transaction.category === "Revenue" ? "text-green-400" : "text-amber-400"
                  }`}
                >
                  {formatCurrency(transaction.amount, transaction.category)}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === "Paid"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-gray-400 text-sm">No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentTransactions
