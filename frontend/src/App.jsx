import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import ServerWakeupIndicator from './components/ServerWakeupIndicator'

// Instantiate Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="h-screen w-screen flex flex-col bg-[#FAF8F5] text-[#1E1F24] font-sans selection:bg-[#1E1F24] selection:text-white overflow-hidden relative">
          <ServerWakeupIndicator />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

