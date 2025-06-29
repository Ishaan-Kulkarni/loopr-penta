"use client"

import type React from "react"
import { useState } from "react"
import { useAppSelector } from "../store/hooks"
import { Download, X } from "lucide-react"
import { useToast } from "../contexts/ToastContext"

interface CSVExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const availableColumns = [
  { key: "id", label: "Transaction ID" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "user_id", label: "User ID" },
]

const CSVExportModal: React.FC<CSVExportModalProps> = ({ isOpen, onClose }) => {
  const { transactions } = useAppSelector((state) => state.transactions)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns.map((col) => col.key))
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  if (!isOpen) return null

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((key) => key !== columnKey) : [...prev, columnKey],
    )
  }

  const handleSelectAll = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns(availableColumns.map((col) => col.key))
    }
  }

  const generateCSV = () => {
    if (selectedColumns.length === 0) {
      toast({
        title: "No columns selected",
        description: "Please select at least one column to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Create CSV headers
      const headers = selectedColumns.map((key) => availableColumns.find((col) => col.key === key)?.label || key)

      // Create CSV rows
      const rows = transactions.map((transaction) =>
        selectedColumns.map((key) => {
          const value = transaction[key as keyof typeof transaction]
          if (key === "date") {
            return new Date(value as string).toLocaleDateString()
          }
          if (key === "amount") {
            return `$${(value as number).toFixed(2)}`
          }
          return value
        }),
      )

      // Combine headers and rows
      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Your CSV file has been downloaded.",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating the CSV file.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Export Transactions</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">Select the columns you want to include in your CSV export.</p>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedColumns.length === availableColumns.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <label htmlFor="select-all" className="font-medium text-white">
              Select All
            </label>
          </div>

          <div className="space-y-2">
            {availableColumns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={column.key}
                  checked={selectedColumns.includes(column.key)}
                  onChange={() => handleColumnToggle(column.key)}
                  className="rounded border-gray-300"
                />
                <label htmlFor={column.key} className="text-white">
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={generateCSV}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSVExportModal
