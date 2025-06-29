import mongoose, { type Document, Schema } from "mongoose"

export interface ITransaction extends Document {
  id: number
  date: Date
  amount: number
  category: "Revenue" | "Expense"
  status: "Paid" | "Pending"
  user_id: string
  user_profile: string
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema: Schema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["Revenue", "Expense"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Paid", "Pending"],
    },
    user_id: {
      type: String,
      required: true,
    },
    user_profile: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<ITransaction>("Transaction", TransactionSchema)
