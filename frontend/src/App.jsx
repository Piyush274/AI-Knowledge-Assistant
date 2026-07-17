import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import AdminDashboard from './pages/AdminDashboard'

// Instantiate Query Client
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Premium Dark Glassmorphic Navigation Bar */}
        <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-850 sticky top-0 z-50 backdrop-blur-md bg-opacity-70 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Antigravity Knowledge Assistant
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-xs uppercase font-semibold tracking-wider text-slate-400 hover:text-slate-100 transition-colors">
              Login
            </Link>
            <Link to="/chat" className="text-xs uppercase font-semibold tracking-wider text-slate-400 hover:text-slate-100 transition-colors">
              Chat Room
            </Link>
            <Link to="/documents" className="text-xs uppercase font-semibold tracking-wider text-slate-400 hover:text-slate-100 transition-colors">
              Ingest Files
            </Link>
            <Link to="/admin" className="text-xs uppercase font-semibold tracking-wider text-slate-400 hover:text-slate-100 transition-colors">
              Admin Board
            </Link>
          </div>
        </nav>

        <main className="bg-slate-950 min-h-screen text-slate-100 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
