"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { fetchTransactions } from "../store/slices/transactionSlice"
import { setShowExportModal } from "../store/slices/uiSlice"
import { Search, Download, Calendar, ChevronLeft, ChevronRight, X, Filter } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import CSVExportModal from "./CSVExportModal"

const TransactionsTable: React.FC = () => {
  const dispatch = useAppDispatch()
  const { transactions, pagination, isLoading } = useAppSelector((state) => state.transactions)
  const { showExportModal } = useAppSelector((state) => state.ui)

  const [localFilters, setLocalFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    sortBy: "date",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  })

  const [searchInput, setSearchInput] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const hasLoadedInitialData = useRef(false)
  const lastFetchParams = useRef("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setLocalFilters(prev => ({ ...prev, search: searchTerm }))
      setCurrentPage(1)
    }, 500)
  }, [])

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setDateRange([start, end])
    setStartDate(start)
    setEndDate(end)

    if (start && end) {
      setLocalFilters(prev => ({
        ...prev,
        dateFrom: start.toISOString().split('T')[0],
        dateTo: end.toISOString().split('T')[0]
      }))
      setCurrentPage(1)
      setShowCalendar(false)
    }
  }

  const clearDateFilter = () => {
    setDateRange([null, null])
    setStartDate(null)
    setEndDate(null)
    setLocalFilters(prev => ({
      ...prev,
      dateFrom: "",
      dateTo: ""
    }))
    setCurrentPage(1)
  }

  const handleQuickDateFilter = (type: string) => {
    const today = new Date()
    let start: Date
    let end: Date = new Date(today)

    switch (type) {
      case 'today':
        start = new Date(today)
        break
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        end = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'thisWeek':
        start = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
        break
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'last7Days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30Days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    setDateRange([start, end])
    setStartDate(start)
    setEndDate(end)
    setLocalFilters(prev => ({
      ...prev,
      dateFrom: start.toISOString().split('T')[0],
      dateTo: end.toISOString().split('T')[0]
    }))
    setCurrentPage(1)
    setShowCalendar(false)
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const currentParams = JSON.stringify({ page: currentPage, filters: localFilters })
    
    if (lastFetchParams.current === currentParams) {
      return
    }

    lastFetchParams.current = currentParams

    const fetchData = () => {
      dispatch(fetchTransactions({ 
        page: currentPage, 
        limit: 10, 
        filters: localFilters 
      }))
    }

    if (!hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true
      fetchData()
    } else {
      fetchData()
    }
  }, [currentPage, localFilters.search, localFilters.category, localFilters.status, localFilters.sortBy, localFilters.sortOrder, localFilters.dateFrom, localFilters.dateTo, dispatch])

  const handlePageChange = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSort = (field: string) => {
    const newSortOrder = localFilters.sortBy === field && localFilters.sortOrder === "asc" ? "desc" : "asc"
    setLocalFilters(prev => ({ ...prev, sortBy: field, sortOrder: newSortOrder }))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    if (key === "search") {
      handleSearchInputChange(value)
    } else {
      setLocalFilters(prev => ({ ...prev, [key]: value }))
      setCurrentPage(1)
    }
  }

  const formatCurrency = (amount: number, category: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

    return category === "Revenue" ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getPaginationValue = (key: string, defaultValue: number) => {
    return pagination && typeof pagination[key as keyof typeof pagination] === 'number' 
      ? pagination[key as keyof typeof pagination] as number 
      : defaultValue
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDateRange = () => {
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    }
    return "Select dates"
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-datepicker {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          font-family: inherit !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        
        .custom-datepicker .react-datepicker__header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
          border-bottom: 1px solid #334155 !important;
          border-radius: 12px 12px 0 0 !important;
          padding: 16px !important;
        }
        
        .custom-datepicker .react-datepicker__current-month {
          color: #ffffff !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          margin-bottom: 12px !important;
          letter-spacing: 0.5px !important;
        }
        
        .custom-datepicker .react-datepicker__navigation {
          top: 20px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          background-color: #374151 !important;
          border: none !important;
          transition: all 0.2s ease !important;
        }
        
        .custom-datepicker .react-datepicker__navigation:hover {
          background-color: #10b981 !important;
          transform: scale(1.05) !important;
        }
        
        .custom-datepicker .react-datepicker__navigation-icon::before {
          border-color: #d1d5db !important;
          border-width: 2px 2px 0 0 !important;
          width: 8px !important;
          height: 8px !important;
        }
        
        .custom-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #ffffff !important;
        }
        
        .custom-datepicker .react-datepicker__day-names {
          margin-bottom: 8px !important;
          padding: 0 8px !important;
        }
        
        .custom-datepicker .react-datepicker__day-name {
          color: #9ca3af !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          margin: 4px !important;
          width: 36px !important;
          line-height: 36px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .custom-datepicker .react-datepicker__week {
          margin: 2px 0 !important;
          padding: 0 8px !important;
        }
        
        .custom-datepicker .react-datepicker__day {
          color: #ffffff !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          margin: 4px !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          position: relative !important;
        }
        
        .custom-datepicker .react-datepicker__day:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3) !important;
        }
        
        .custom-datepicker .react-datepicker__day--selected {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
        }
        
        .custom-datepicker .react-datepicker__day--in-range {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          opacity: 0.8 !important;
        }
        
        .custom-datepicker .react-datepicker__day--in-selecting-range {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
          color: #ffffff !important;
        }
        
        .custom-datepicker .react-datepicker__day--range-start,
        .custom-datepicker .react-datepicker__day--range-end {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5) !important;
        }
        
        .custom-datepicker .react-datepicker__day--disabled {
          color: #4b5563 !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
        
        .custom-datepicker .react-datepicker__day--outside-month {
          color: #6b7280 !important;
          opacity: 0.5 !important;
        }
        
        .custom-datepicker .react-datepicker__month-container {
          background-color: #1e293b !important;
        }
        
        .custom-datepicker .react-datepicker__month {
          padding: 16px !important;
          background-color: #1e293b !important;
        }
        
        .custom-datepicker .react-datepicker__today-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          margin: 8px !important;
          font-weight: 600 !important;
        }
        `
      }} />

      <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Transactions</h3>
          <button
            onClick={() => dispatch(setShowExportModal(true))}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            {searchInput !== localFilters.search && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              </div>
            )}
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center space-x-4">
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="all">All Categories</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>

            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Calendar Filter */}
            <div className="relative calendar-container">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg flex items-center space-x-2 transition-all min-w-[180px] ${
                  startDate && endDate 
                    ? 'text-green-400 border-green-500 bg-green-500/10 shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:border-slate-500'
                }`}
              >
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{formatDateRange()}</span>
                {startDate && endDate && (
                  <X 
                    className="h-3 w-3 hover:text-red-400 flex-shrink-0 transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation()
                      clearDateFilter()
                    }}
                  />
                )}
              </button>

              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 min-w-[420px] overflow-hidden">
                  {/* Quick Filters Section */}
                  <div className="p-6 border-b border-slate-600">
                    <h4 className="text-white text-sm font-bold mb-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-400" />
                      Quick Filters
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'today', label: 'Today' },
                        { key: 'yesterday', label: 'Yesterday' },
                        { key: 'thisWeek', label: 'This Week' },
                        { key: 'thisMonth', label: 'This Month' },
                        { key: 'last7Days', label: 'Last 7 Days' },
                        { key: 'last30Days', label: 'Last 30 Days' }
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => handleQuickDateFilter(key)}
                          className="text-sm bg-slate-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 text-white px-4 py-3 rounded-lg transition-all duration-200 border border-slate-600 hover:border-green-500 transform hover:scale-105 font-medium"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Range Section */}
                  <div className="p-6">
                    <h4 className="text-white text-sm font-bold mb-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-400" />
                      Custom Range
                    </h4>
                    <div className="custom-datepicker">
                      <DatePicker
                        selected={startDate}
                        onChange={handleDateRangeChange}
                        startDate={startDate}
                        endDate={endDate}
                        selectsRange
                        inline
                        monthsShown={1}
                        showPopperArrow={false}
                      />
                    </div>
                  </div>
                  
                  {/* Footer */}
                  {(startDate || endDate) && (
                    <div className="p-4 bg-slate-700/50 border-t border-slate-600 flex items-center justify-between">
                      <span className="text-sm text-gray-300 font-medium">
                        {startDate && endDate 
                          ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                          : startDate 
                            ? `From ${startDate.toLocaleDateString()}`
                            : endDate 
                              ? `Until ${endDate.toLocaleDateString()}`
                              : ''
                        }
                      </span>
                      <button
                        onClick={clearDateFilter}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white flex items-center justify-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Mobile Filters Dropdown */}
          {showMobileFilters && (
            <div className="sm:hidden space-y-3 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <select
                value={localFilters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Categories</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>

              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg flex items-center justify-center space-x-2 ${
                  startDate && endDate ? 'text-green-400 border-green-500' : 'text-gray-400'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDateRange()}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active filters display */}
        {(startDate && endDate) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Active filters:</span>
            <div className="flex items-center space-x-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/20">
              <Calendar className="h-3 w-3" />
              <span>{formatDateRange()}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-green-300 ml-1 transition-colors" 
                onClick={clearDateFilter}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th
                      className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors font-semibold"
                      onClick={() => handleSort("user_id")}
                    >
                      Name {localFilters.sortBy === "user_id" && (localFilters.sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors font-semibold"
                      onClick={() => handleSort("date")}
                    >
                      Date {localFilters.sortBy === "date" && (localFilters.sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors font-semibold"
                      onClick={() => handleSort("amount")}
                    >
                      Amount {localFilters.sortBy === "amount" && (localFilters.sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="text-left py-4 px-4 text-gray-400 cursor-pointer hover:text-white transition-colors font-semibold"
                      onClick={() => handleSort("status")}
                    >
                      Status {localFilters.sortBy === "status" && (localFilters.sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((transaction: any) => (
                      <tr key={transaction.id || transaction._id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
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
                            <span className="font-semibold text-white">{transaction.user_id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300 font-medium">{formatDate(transaction.date)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`font-bold text-lg ${
                              transaction.category === "Revenue" ? "text-green-400" : "text-amber-400"
                            }`}
                          >
                            {formatCurrency(transaction.amount, transaction.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              transaction.status === "Paid"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400">
                        {Array.isArray(transactions) ? "No transactions found" : "Loading transactions..."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((transaction: any) => (
                  <div key={transaction.id || transaction._id} className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
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
                        <div>
                          <h4 className="font-semibold text-white">{transaction.user_id}</h4>
                          <p className="text-sm text-gray-400">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          transaction.status === "Paid"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Amount</span>
                      <span
                        className={`font-bold text-lg ${
                          transaction.category === "Revenue" ? "text-green-400" : "text-amber-400"
                        }`}
                      >
                        {formatCurrency(transaction.amount, transaction.category)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400">
                  {Array.isArray(transactions) ? "No transactions found" : "Loading transactions..."}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
                <div className="text-gray-400 text-sm">
                  Showing {(getPaginationValue('currentPage', 1) - 1) * getPaginationValue('itemsPerPage', 10) + 1} to{" "}
                  {Math.min(
                    getPaginationValue('currentPage', 1) * getPaginationValue('itemsPerPage', 10), 
                    getPaginationValue('totalItems', 0)
                  )} of{" "}
                  {getPaginationValue('totalItems', 0)} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(getPaginationValue('currentPage', 1) - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-white font-medium px-4">
                    Page {getPaginationValue('currentPage', 1)} of {getPaginationValue('totalPages', 1)}
                  </span>
                  <button
                    onClick={() => handlePageChange(getPaginationValue('currentPage', 1) + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CSVExportModal isOpen={showExportModal} onClose={() => dispatch(setShowExportModal(false))} />
    </>
  )
}

export default TransactionsTable