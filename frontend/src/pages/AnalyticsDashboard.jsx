import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AnalyticsChart from '../components/AnalyticsChart'
import client from '../api/client'

function AnalyticsDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }

    async function fetchAnalytics() {
      try {
        setLoading(true)
        const res = await client.get('/analytics/dashboard')
        setData(res.data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch analytics', err)
        setError('Failed to load system metrics. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 text-slate-100 p-8 rounded-2xl border border-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Loading System Metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 text-slate-100 p-8 rounded-2xl border border-slate-900">
        <div className="text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  const { active_users, files_ingested, queries_24h, avg_latency, daily_stats, recent_activities } = data

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
              System Analytics & Performance
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
            <div className="text-2xl font-extrabold text-slate-100 font-mono">{active_users}</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>System-wide users</span>
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Files Ingested</span>
              <span className="text-lg">📚</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">{files_ingested}</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>database chunks safe</span>
            </div>
          </div>

          {/* Card 3: Query Volume */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Queries (24h)</span>
              <span className="text-lg">⚡</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">{queries_24h}</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>active search queries</span>
            </div>
          </div>

          {/* Card 4: Average Latency */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-2 select-none">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Avg Latency</span>
              <span className="text-lg">⏳</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">{avg_latency}ms</div>
            <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1">
              <span>average retrieval response</span>
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
          <AnalyticsChart data={daily_stats} />
        </div>

        {/* Audit Log / Recent Events Table */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-slate-850">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 select-none">
              Recent Event Audit Log
            </h2>
          </div>
          
          <div className="divide-y divide-slate-850">
            {recent_activities.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500 font-mono">
                No events recorded yet. Perform chat queries or ingest files to see metrics.
              </div>
            ) : (
              recent_activities.map((act) => (
                <div 
                  key={act.id} 
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-900/35 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon badge matching event type */}
                    <span className="text-sm select-none">
                      {act.type === 'upload' ? '📤' : act.type === 'query' ? '💬' : act.type === 'signup' ? '👤' : '⚙️'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        <span className="text-blue-400 font-mono text-xs font-semibold mr-1">{act.user}</span>
                        {act.type === 'upload' ? 'triggered document ingestion' : act.type === 'query' ? 'executed chat query' : act.type === 'signup' ? 'created account' : 'performed operation'}
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
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AnalyticsDashboard
