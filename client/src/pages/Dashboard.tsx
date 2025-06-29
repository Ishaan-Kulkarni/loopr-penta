"use client"

import type React from "react"
import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { setActiveView } from "../store/slices/uiSlice"
import {
  fetchTransactionStats,
  fetchChartData,
  fetchRecentTransactions,
} from "../store/slices/transactionSlice"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import MetricCards from "../components/MetricCards"
import OverviewChart from "../components/OverviewChart"
import RecentTransactions from "../components/RecentTransactions"
import TransactionsTable from "../components/TransactionsTable"

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { activeView } = useAppSelector((state) => state.ui)
  const { isLoading } = useAppSelector((state) => state.transactions)

  useEffect(() => {
    if (activeView === "dashboard") {
      dispatch(fetchTransactionStats())
      dispatch(fetchChartData("monthly"))
      dispatch(fetchRecentTransactions(5))
    }
  }, [dispatch, activeView])

  const handleLogout = () => {
    // Additional cleanup if needed
  }

  const handleViewChange = (view: string) => {
    dispatch(setActiveView(view))
  }

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {activeView === "dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
                <div className="text-sm text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <MetricCards />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <OverviewChart />
                </div>
                <div className="xl:col-span-1">
                  <RecentTransactions />
                </div>
              </div>

              <TransactionsTable />

            </div>
          )}

          {activeView === "transactions" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Transactions Coming Soon</h3>
                  <p className="text-gray-400">This feature is under development.</p>
                </div>
              </div>
            </div>
          )}

          {activeView === "wallet" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Wallet Coming Soon</h3>
                  <p className="text-gray-400">This feature is under development.</p>
                </div>
              </div>
            </div>
          )}

          {activeView === "analytics" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-400">Advanced analytics features are under development.</p>
                </div>
              </div>
            </div>
          )}

          {(activeView === "personal" || activeView === "message" || activeView === "setting") && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚧</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Coming Soon
                  </h3>
                  <p className="text-gray-400">This feature is under development.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
