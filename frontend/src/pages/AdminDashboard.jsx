import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AnalyticsChart from '../components/AnalyticsChart'

// Mock activity events list (to be loaded from db in Module 7)
const recentActivitiesMock = [
  { id: 1, type: 'upload', user: 'sam@example.com', target: 'quarterly_report.pdf', time: '10 mins ago' },
  { id: 2, type: 'query', user: 'piyush@example.com', target: 'Semantic Search on postgres chunks', time: '24 mins ago' },
  { id: 3, type: 'signup', user: 'jane@example.com', target: 'New user registration', time: '1 hour ago' },
  { id: 4, type: 'delete', user: 'sam@example.com', target: 'old_notes.docx', time: '3 hours ago' },
  { id: 5, type: 'query', user: 'clara@example.com', target: 'Vite config routing details', time: '5 hours ago' }
]

function AdminDashboard() {
  const navigate = useNavigate()

  // Authenticated boundary check
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 p-4 md:p-8 rounded-2xl border border-slate-900 shadow-2xl relative">
      
      {/* Background radial soft light decoration */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Page title header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Admin Systems Analytics
            </h1>
            <p className="text-sm text-slate-400">
              Real-time monitoring panel for vector ingestion, search requests, and latency.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl text-indigo-400 select-none">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Live Monitoring Mode
          </div>
        </div>

        {/* 4-Column KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Users */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Active Users</span>
              <span className="text-lg">👥</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">148</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>↑ +12%</span>
              <span className="text-slate-500 font-normal">from last week</span>
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Files Ingested</span>
              <span className="text-lg">📚</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">612</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>↑ +4.2%</span>
              <span className="text-slate-500 font-normal">database chunks safe</span>
            </div>
          </div>

          {/* Card 3: Query Volume */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Queries (24h)</span>
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">1,024</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>↑ +18.5%</span>
              <span className="text-slate-500 font-normal">active SSE streams</span>
            </div>
          </div>

          {/* Card 4: Average Latency */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Avg Latency</span>
              <span className="text-lg">⏳</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">185ms</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>↓ -15ms</span>
              <span className="text-slate-500 font-normal">faster retrieval index</span>
            </div>
          </div>

        </div>

        {/* Chart Panel Section */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 select-none">
              Request Frequency vs. Processing Delay
            </h2>
            <p className="text-xs text-slate-500 mt-1 select-none">
              Visual analytics matching daily user LLM requests with average token streaming response times.
            </p>
          </div>
          <AnalyticsChart />
        </div>

        {/* Audit Log / Recent Events Table */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-slate-850">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 select-none">
              Recent Event Audit Log
            </h2>
          </div>
          
          <div className="divide-y divide-slate-850">
            {recentActivitiesMock.map((act) => (
              <div 
                key={act.id} 
                className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-900/35 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Icon badge matching event type */}
                  <span className="text-sm select-none">
                    {act.type === 'upload' ? '📤' : act.type === 'query' ? '💬' : act.type === 'signup' ? '👤' : '🗑️'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      <span className="text-blue-400 font-mono text-xs font-semibold mr-1">{act.user}</span>
                      {act.type === 'upload' ? 'uploaded document' : act.type === 'query' ? 'asked query' : act.type === 'signup' ? 'created account' : 'deleted file'}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 max-w-[280px] sm:max-w-md truncate" title={act.target}>
                      {act.target}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 select-none whitespace-nowrap">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard
