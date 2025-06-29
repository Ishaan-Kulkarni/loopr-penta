import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authService } from "../../services/authService"
import type { User, AuthResponse } from "../../types"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  error: null,
  isAuthenticated: false,
}

// Async thunks
export const loginUser = createAsyncThunk<AuthResponse, { email: string; password: string }>(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password)
      localStorage.setItem("token", response.token)
      return response
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Login failed")
    }
  },
)

export const registerUser = createAsyncThunk<AuthResponse, { name: string; email: string; password: string }>(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.register(name, email, password)
      localStorage.setItem("token", response.token)
      return response
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Registration failed")
    }
  },
)

export const verifyToken = createAsyncThunk<{ user: User }, string>(
  "auth/verify",
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyToken(token)
      return response
    } catch (error) {
      localStorage.removeItem("token")
      return rejectWithValue("Token verification failed")
    }
  },
)

// Add this action if it doesn't exist
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Verify token with backend
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Token invalid")
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      localStorage.removeItem("token")
      return rejectWithValue(error instanceof Error ? error.message : "Auth check failed")
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem("token")
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.error = null
      })
      .addCase(verifyToken.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.error = null
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
        state.isLoading = false
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.isLoading = false
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
