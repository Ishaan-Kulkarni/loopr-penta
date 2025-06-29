export interface Transaction {
  id: number
  _id?: string
  date: string
  amount: number
  category: "Revenue" | "Expense"
  status: "Paid" | "Pending"
  user_id: string
  user_profile: string // Add this field
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}
