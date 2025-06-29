export interface Transaction {
  id: number
  date: string
  amount: number
  category: "Revenue" | "Expense"
  status: "Paid" | "Pending"
  user_id: string
  user_profile: string
}

export interface User {
  id: string
  email: string
  name: string
  password: string
}

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    name: string
  }
}

export interface JWTPayload {
  userId: string
  email: string
  name: string
}
