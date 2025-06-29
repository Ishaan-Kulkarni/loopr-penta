import type { Transaction } from "../types"

const API_BASE_URL = process.env.REACT_APP_API_URL

interface TransactionFilters {
  search?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: string
}

interface TransactionParams {
  page?: number
  limit?: number
  filters?: TransactionFilters
}

export const transactionService = {
  async getTransactions(params: TransactionParams = {}) {
    const token = localStorage.getItem("token")
    const { page = 1, limit = 10, filters = {} } = params

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== "all")),
    })

    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch transactions")
    }

    return response.json()
  },

  async getTransactionStats() {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/transactions/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch transaction stats")
    }

    return response.json()
  },

  async getChartData(period: string = 'monthly') {
    const token = localStorage.getItem("token")
    const queryParams = period ? `?period=${period}` : ''
    
    const response = await fetch(`${API_BASE_URL}/transactions/chart-data${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch chart data")
    }

    return response.json()
  },

  async getRecentTransactions(limit = 5) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/transactions/recent?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch recent transactions")
    }

    return response.json()
  },

  async createTransaction(transactionData: Partial<Transaction>) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      throw new Error("Failed to create transaction")
    }

    return response.json()
  },

  async updateTransaction(id: number, transactionData: Partial<Transaction>) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      throw new Error("Failed to update transaction")
    }

    return response.json()
  },

  async deleteTransaction(id: number) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete transaction")
    }

    return response.json()
  },
}
