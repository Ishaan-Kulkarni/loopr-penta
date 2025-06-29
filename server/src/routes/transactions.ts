import express, { type Response } from "express"
import { query, validationResult } from "express-validator"
import { authenticateToken } from "../middleware/auth"
import Transaction from "../models/Transaction"
import * as path from "path"
import * as fs from "fs"

const router = express.Router()

// Load transactions data
const transactionsDataPath = path.join(__dirname, "../../data/transactions.json")
const transactionsData = JSON.parse(fs.readFileSync(transactionsDataPath, "utf8"))

// @route   POST /api/transactions/seed
// @desc    Seed database with transaction data from JSON file
// @access  Private
router.post("/seed" , async (req: any, res: Response): Promise<void> => {
  try {
    // Clear existing transactions
    await Transaction.deleteMany({})
    console.log("Cleared existing transactions...")

    // Insert all transactions from JSON file
    const insertedTransactions = await Transaction.insertMany(transactionsData)
    console.log(`Successfully seeded ${insertedTransactions.length} transactions`)

    res.status(201).json({
      status: "success",
      message: `Database seeded successfully with ${insertedTransactions.length} transactions`,
      count: insertedTransactions.length,
    })
  } catch (error) {
    console.error("Seed database error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to seed database",
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

// @route   GET /api/transactions/recent
// @desc    Get recent transactions
// @access  Private
router.get("/recent", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const limit = Number.parseInt(req.query.limit as string) || 5

    const recentTransactions = await Transaction.find().sort({ date: -1 }).limit(limit)

    res.json({
      status: "success",
      data: recentTransactions,
    })
  } catch (error) {
    console.error("Get recent transactions error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent transactions",
    })
  }
})

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get("/stats", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$category", "Revenue"] }, { $eq: ["$status", "Paid"] }] }, "$amount", 0],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$category", "Expense"] }, { $eq: ["$status", "Paid"] }] }, "$amount", 0],
            },
          },
          pendingRevenue: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$category", "Revenue"] }, { $eq: ["$status", "Pending"] }] }, "$amount", 0],
            },
          },
          pendingExpenses: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$category", "Expense"] }, { $eq: ["$status", "Pending"] }] }, "$amount", 0],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ])

    const result = stats[0] || {
      totalRevenue: 0,
      totalExpenses: 0,
      pendingRevenue: 0,
      pendingExpenses: 0,
      totalTransactions: 0,
    }

    const balance = result.totalRevenue - result.totalExpenses
    const savings = balance * 0.2 // 20% savings rate

    res.json({
      status: "success",
      data: {
        ...result,
        balance,
        savings,
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics",
    })
  }
})

// @route   GET /api/transactions/chart-data
// @desc    Get chart data for overview with period filtering
// @access  Private
router.get("/chart-data", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || "monthly"

    let chartData: any[] = []

    switch (period) {
      case "weekly":
        // Get last 8 weeks of data
        chartData = await Transaction.aggregate([
          {
            $match: {
              status: "Paid",
              date: {
                $gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000) // Last 8 weeks
              }
            },
          },
          {
            $group: {
              _id: {
                week: { $week: "$date" },
                year: { $year: "$date" },
                category: "$category",
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.week": 1,
            },
          },
        ])

        // Process weekly data
        const weeklyData: { [key: string]: { income: number; expenses: number } } = {}
        
        chartData.forEach((item) => {
          const weekKey = `Week ${item._id.week}`

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { income: 0, expenses: 0 }
          }
          
          if (item._id.category === "Revenue") {
            weeklyData[weekKey].income = item.total
          } else {
            weeklyData[weekKey].expenses = item.total
          }
        })

        // Get last 8 weeks
        const weeks = Object.keys(weeklyData).slice(-8)
        chartData = weeks.map((week) => ({
          month: week,
          income: weeklyData[week].income,
          expenses: weeklyData[week].expenses,
        }))
        break

      case "yearly":
        // Get data grouped by year
        chartData = await Transaction.aggregate([
          {
            $match: {
              status: "Paid",
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$date" },
                category: "$category",
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $sort: {
              "_id.year": 1,
            },
          },
        ])

        // Process yearly data
        const yearlyData: { [key: string]: { income: number; expenses: number } } = {}
        
        chartData.forEach((item) => {
          const yearKey = item._id.year.toString()
          
          if (!yearlyData[yearKey]) {
            yearlyData[yearKey] = { income: 0, expenses: 0 }
          }
          
          if (item._id.category === "Revenue") {
            yearlyData[yearKey].income = item.total
          } else {
            yearlyData[yearKey].expenses = item.total
          }
        })

        chartData = Object.keys(yearlyData).map((year) => ({
          month: year,
          income: yearlyData[year].income,
          expenses: yearlyData[year].expenses,
        }))
        break

      case "monthly":
      default:
        // Monthly data (existing logic)
        chartData = await Transaction.aggregate([
          {
            $match: {
              status: "Paid",
            },
          },
          {
            $group: {
              _id: {
                month: { $month: "$date" },
                year: { $year: "$date" },
                category: "$category",
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
            },
          },
        ])

        // Process monthly data
        const monthlyData: { [key: string]: { income: number; expenses: number } } = {}

        chartData.forEach((item) => {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          const monthKey = monthNames[item._id.month - 1]

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 }
          }

          if (item._id.category === "Revenue") {
            monthlyData[monthKey].income = item.total
          } else {
            monthlyData[monthKey].expenses = item.total
          }
        })

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        // Fill in missing months with zero values
        chartData = months.map((month) => {
          const data = monthlyData[month] || { income: 0, expenses: 0 }
          return {
            month,
            income: data.income,
            expenses: data.expenses,
          }
        })
        break
    }

    res.json({
      status: "success",
      data: chartData,
      period,
    })
  } catch (error) {
    console.error("Get chart data error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch chart data",
    })
  }
})

// @route   GET /api/transactions
// @desc    Get all transactions with filtering, sorting, and pagination
// @access  Private
router.get("/", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "all",
      status = "all",
      sortBy = "date",
      sortOrder = "desc",
      dateFrom = "",
      dateTo = "",
    } = req.query

    // Build filter object
    const filter: any = {}

    // Category filter
    if (category && category !== "all") {
      filter.category = category
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status
    }

    // Date range filter
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)
      // Set time to cover the full day
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      }
    } else if (dateFrom) {
      const startDate = new Date(dateFrom)
      startDate.setHours(0, 0, 0, 0)
      filter.date = { $gte: startDate }
    } else if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      filter.date = { $lte: endDate }
    }

    // Search functionality
    if (search) {
      const searchNumber = parseFloat(search)
      const searchInt = parseInt(search)
      
      const searchConditions: any[] = [
        // Search by category (Revenue, Expense)
        { category: { $regex: search, $options: "i" } },
        // Search by status (Paid, Pending)  
        { status: { $regex: search, $options: "i" } },
        // Search by user_id (user_001, user_002, etc.)
        { user_id: { $regex: search, $options: "i" } }
      ]

      // Add numeric searches if valid numbers
      if (!isNaN(searchNumber) && searchNumber > 0) {
        // Search by exact amount
        searchConditions.push({ amount: searchNumber })
        
        // Search by amount range (for partial matches like "150" matching "1500")
        searchConditions.push({ 
          amount: { 
            $gte: searchNumber, 
            $lt: searchNumber * 10 
          } 
        })
      }

      if (!isNaN(searchInt) && searchInt > 0) {
        // Search by transaction ID
        searchConditions.push({ id: searchInt })
      }

      // Search by date if valid date format
      const searchDate = new Date(search)
      if (!isNaN(searchDate.getTime()) && search.length >= 4) {
        // Handle different date formats
        if (search.includes('-') || search.includes('/')) {
          const startOfDay = new Date(searchDate)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(searchDate)
          endOfDay.setHours(23, 59, 59, 999)
          
          searchConditions.push({
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          })
        }
        
        // Also search by year
        const year = searchDate.getFullYear()
        if (search.length === 4 && !isNaN(year)) {
          // Search by year only (e.g., "2024")
          searchConditions.push({
            date: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1)
            }
          })
        }
      }

      // If we already have date filter from calendar, combine with search
      if (filter.date) {
        filter.$and = [
          { date: filter.date },
          { $or: searchConditions }
        ]
        delete filter.date
      } else {
        filter.$or = searchConditions
      }
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit)

    // Execute queries
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit))
    const hasNext = Number(page) < totalPages
    const hasPrev = Number(page) > 1

    res.json({
      status: "success",
      data: {
        transactions: transactions, // This should be an array
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number(limit),
          hasNext,
          hasPrev,
        },
      },
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch transactions",
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post("/", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { amount, category, status, user_id, user_profile } = req.body

    // Validate required fields
    if (!amount || !category || !status || !user_id) {
      res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, category, status, user_id",
      })
      return
    }

    // Get the highest existing ID and increment
    const lastTransaction = await Transaction.findOne().sort({ id: -1 })
    const nextId = lastTransaction ? lastTransaction.id + 1 : 1

    const transaction = new Transaction({
      id: nextId,
      date: new Date(),
      amount: Number(amount),
      category,
      status,
      user_id,
      user_profile: user_profile || "https://thispersondoesnotexist.com/",
    })

    await transaction.save()

    res.status(201).json({
      status: "success",
      message: "Transaction created successfully",
      data: transaction,
    })
  } catch (error) {
    console.error("Create transaction error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to create transaction",
    })
  }
})

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put("/:id", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    const transaction = await Transaction.findOneAndUpdate({ id: Number.parseInt(id) }, updates, {
      new: true,
      runValidators: true,
    })

    if (!transaction) {
      res.status(404).json({
        status: "error",
        message: "Transaction not found",
      })
      return
    }

    res.json({
      status: "success",
      message: "Transaction updated successfully",
      data: transaction,
    })
  } catch (error) {
    console.error("Update transaction error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to update transaction",
    })
  }
})

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete("/:id", authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const transaction = await Transaction.findOneAndDelete({ id: Number.parseInt(id) })

    if (!transaction) {
      res.status(404).json({
        status: "error",
        message: "Transaction not found",
      })
      return
    }

    res.json({
      status: "success",
      message: "Transaction deleted successfully",
    })
  } catch (error) {
    console.error("Delete transaction error:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to delete transaction",
    })
  }
})


export default router
