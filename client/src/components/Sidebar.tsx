"use client"

import type React from "react"
import { useState } from "react"
import { LayoutDashboard, CreditCard, Wallet, BarChart3, User, MessageSquare, Settings, Menu, X } from "lucide-react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "personal", label: "Personal", icon: User },
  { id: "message", label: "Message", icon: MessageSquare },
  { id: "setting", label: "Setting", icon: Settings },
]

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuItemClick = (viewId: string) => {
    onViewChange(viewId)
    setIsMobileMenuOpen(false) // Close mobile menu after selection
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg md:hidden shadow-lg hover:bg-slate-700 transition-colors"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 
          flex flex-col transform transition-transform duration-300 ease-in-out
          md:transform-none shadow-2xl
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-12 border-b border-slate-700">
          <img
            src="/logo.png"
            alt="Loopr Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <button
                key={item.id}
                className={`
                  w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200
                  ${isActive
                    ? "bg-gradient-to-r from-green-500/10 to-green-600/5 text-green-400 border-l-4 border-green-500 shadow-lg"
                    : "text-gray-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
                  }
                `}
                onClick={() => handleMenuItemClick(item.id)}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-green-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-gray-500 text-center">
            © 2024 Loopr. All rights reserved.
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
