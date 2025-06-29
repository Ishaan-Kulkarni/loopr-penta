import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { transactionService } from "../../services/transactionService"
import type { Transaction } from "../../types"

interface TransactionFilters {
  search: string
  category: string
  status: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number // Changed from totalCount
  itemsPerPage: number // Changed from limit
  hasNext: boolean // Changed from hasNextPage
  hasPrev: boolean // Changed from hasPrevPage
}

interface TransactionStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
  balance: number // Added
  totalRevenue: number // Added
  savings: number // Added
}

interface ChartDataPoint {
  month: string
  income: number
  expenses: number
}

interface TransactionState {
  transactions: Transaction[]
  recentTransactions: Transaction[]
  stats: TransactionStats | null
  chartData: ChartDataPoint[]
  pagination: PaginationInfo | null
  filters: TransactionFilters
  isLoading: boolean
  error: string | null
}

const initialState: TransactionState = {
  transactions: [],
  recentTransactions: [],
  stats: {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    balance: 0, // Added
    totalRevenue: 0, // Added
    savings: 0, // Added
  },
  chartData: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0, // Changed from totalCount
    itemsPerPage: 10, // Changed from limit
    hasNext: false, // Changed from hasNextPage
    hasPrev: false, // Changed from hasPrevPage
  },
  filters: {
    search: "",
    category: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    sortBy: "date",
    sortOrder: "desc",
  },
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (params: { page?: number; limit?: number; filters?: Partial<TransactionFilters> }, { rejectWithValue }) => {
    try {
      const response = await transactionService.getTransactions(params)
      return response
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch transactions")
    }
  },
)

export const fetchTransactionStats = createAsyncThunk("transactions/fetchStats", async (_, { rejectWithValue }) => {
  try {
    const response = await transactionService.getTransactionStats()
    return response.data
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch stats")
  }
})

export const fetchChartData = createAsyncThunk(
  "transactions/fetchChartData", 
  async (period: string = 'monthly', { rejectWithValue }) => {
    try {
      const response = await transactionService.getChartData(period)
      return response.data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch chart data")
    }
  }
)

export const fetchRecentTransactions = createAsyncThunk(
  "transactions/fetchRecent",
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const response = await transactionService.getRecentTransactions(limit)
      return response.data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch recent transactions")
    }
  },
)

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        
        // Make sure we're accessing the correct path in the response
        if (action.payload && action.payload.data) {
          state.transactions = action.payload.data.transactions || []
          
          // Map backend pagination to frontend pagination structure
          const backendPagination = action.payload.data.pagination
          if (backendPagination) {
            state.pagination = {
              currentPage: backendPagination.currentPage || 1,
              totalPages: backendPagination.totalPages || 1,
              totalItems: backendPagination.totalItems || 0,
              itemsPerPage: backendPagination.itemsPerPage || 10,
              hasNext: backendPagination.hasNext || false,
              hasPrev: backendPagination.hasPrev || false,
            }
          }
        } else {
          // Fallback to empty array if structure is different
          state.transactions = []
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string || "Failed to fetch transactions"
        state.transactions = [] // Ensure it's still an array on error
      })
      // Fetch stats
      .addCase(fetchTransactionStats.fulfilled, (state, action) => {
        // Map backend stats to frontend stats structure
        const backendStats = action.payload
        state.stats = {
          totalIncome: backendStats.totalIncome || 0,
          totalExpenses: backendStats.totalExpenses || 0,
          netProfit: backendStats.netProfit || 0,
          transactionCount: backendStats.transactionCount || 0,
          balance: backendStats.balance || backendStats.totalIncome - backendStats.totalExpenses || 0,
          totalRevenue: backendStats.totalRevenue || backendStats.totalIncome || 0,
          savings: backendStats.savings || (backendStats.totalIncome - backendStats.totalExpenses) * 0.2 || 0,
        }
      })
      // Fetch chart data
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.chartData = action.payload
      })
      // Fetch recent transactions
      .addCase(fetchRecentTransactions.fulfilled, (state, action) => {
        state.recentTransactions = action.payload
      })
  },
})

export const { setFilters, clearFilters, clearError } = transactionSlice.actions
export default transactionSlice.reducer
