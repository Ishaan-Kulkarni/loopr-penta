import express, { type Request, type Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import User from "../models/User"
import { authenticateToken } from "../middleware/auth"

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters long"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        })
        return
      }

      const { email, password, name } = req.body

      // Check if user exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({
          status: "error",
          message: "User with this email already exists",
        })
        return
      }

      // Hash password
      const salt = await bcrypt.genSalt(12)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
      })

      await user.save()

      // Generate JWT
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        status: "error",
        message: "Internal server error during registration",
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        })
        return
      }

      const { email, password } = req.body

      // Check if user exists
      const user = await User.findOne({ email }).select("+password")
      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Invalid email or password",
        })
        return
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        res.status(401).json({
          status: "error",
          message: "Invalid email or password",
        })
        return
      }

      // Generate JWT
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )

      res.json({
        status: "success",
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        status: "error",
        message: "Internal server error during login",
      })
    }
  },
)

// @route   GET /api/auth/verify
// @desc    Verify token
// @access  Private
router.get("/verify", authenticateToken, (req: any, res: Response): void => {
  res.json({
    status: "success",
    valid: true,
    user: req.user,
  })
})

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authenticateToken, (req: any, res: Response): void => {
  res.json({
    status: "success",
    message: "Logged out successfully",
  })
})

export default router
