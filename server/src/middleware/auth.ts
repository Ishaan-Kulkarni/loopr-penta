import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import type { JWTPayload } from "../types"

interface AuthRequest extends Request {
  user?: JWTPayload
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Access token required",
    })
    return
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({
      status: "error",
      message: "Invalid or expired token",
    })
  }
}
