import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, FileStack, Zap, Clock, Activity, AlertCircle } from 'lucide-react'
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
      <div className="flex-1 flex items-center justify-center bg-[#FAF8F5] text-[#1E1F24] p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1E1F24] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#73716D] font-medium text-xs">Loading System Metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF8F5] text-[#1E1F24] p-8">
        <div className="text-center space-y-3 bg-white p-6 rounded-2xl border border-[#E7E2D8]">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-rose-700 font-medium text-sm">{error}</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-[#1E1F24] text-white rounded-xl text-xs font-semibold"
          >
            Return to Chat
          </button>
        </div>
      </div>
    )
  }

  const { active_users, files_ingested, queries_24h, avg_latency, daily_stats, recent_activities } = data || {}

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF8F5] text-[#1E1F24] overflow-y-auto p-6 lg:p-10 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#73716D] hover:text-[#1E1F24] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E7E2D8] text-xs font-medium rounded-full text-[#1E1F24] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live System Monitoring
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-serif text-[#1C1C1F] tracking-tight">
            System Analytics & Performance
          </h1>
          <p className="text-sm text-[#73716D]">
            Real-time monitoring panel for vector ingestion, search requests, and latency.
          </p>
        </div>

        {/* 4-Column KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Users */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-2">
            <div className="flex items-center justify-between text-[#73716D] text-xs font-semibold uppercase tracking-wider">
              <span>Active Users</span>
              <Users className="w-4 h-4 text-[#73716D]" />
            </div>
            <div className="text-3xl font-serif font-bold text-[#18191D]">{active_users || 0}</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              System registered accounts
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-2">
            <div className="flex items-center justify-between text-[#73716D] text-xs font-semibold uppercase tracking-wider">
              <span>Files Ingested</span>
              <FileStack className="w-4 h-4 text-[#73716D]" />
            </div>
            <div className="text-3xl font-serif font-bold text-[#18191D]">{files_ingested || 0}</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Vectorized knowledge chunks
            </div>
          </div>

          {/* Card 3: Query Volume */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-2">
            <div className="flex items-center justify-between text-[#73716D] text-xs font-semibold uppercase tracking-wider">
              <span>Queries (24h)</span>
              <Zap className="w-4 h-4 text-[#E65F38]" />
            </div>
            <div className="text-3xl font-serif font-bold text-[#18191D]">{queries_24h || 0}</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Search & RAG generations
            </div>
          </div>

          {/* Card 4: Average Latency */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-2">
            <div className="flex items-center justify-between text-[#73716D] text-xs font-semibold uppercase tracking-wider">
              <span>Avg Latency</span>
              <Clock className="w-4 h-4 text-[#73716D]" />
            </div>
            <div className="text-3xl font-serif font-bold text-[#18191D]">{avg_latency || 0}ms</div>
            <div className="text-[11px] text-[#73716D] font-medium">
              Average token generation time
            </div>
          </div>

        </div>

        {/* Chart Panel Section */}
        <div className="bg-white border border-[#E7E2D8] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#73716D] select-none">
              Request Frequency vs. Processing Delay
            </h2>
            <p className="text-xs text-[#8E8D98] mt-1 select-none">
              Daily user chat queries matched with average token streaming response times.
            </p>
          </div>
          <AnalyticsChart data={daily_stats} />
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <div className="px-6 py-4 border-b border-[#F0EBE2]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#73716D] select-none">
              Recent Event Audit Log
            </h2>
          </div>
          
          <div className="divide-y divide-[#F0EBE2]">
            {(!recent_activities || recent_activities.length === 0) ? (
              <div className="px-6 py-8 text-center text-xs text-[#8E8D98] font-mono">
                No events recorded yet. Perform chat queries or ingest files to see live metrics.
              </div>
            ) : (
              recent_activities.map((act) => (
                <div 
                  key={act.id} 
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm select-none">
                      {act.type === 'upload' ? '📤' : act.type === 'query' ? '💬' : act.type === 'signup' ? '👤' : '⚙️'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1E1F24]">
                        <span className="text-[#E65F38] font-mono text-xs font-semibold mr-1.5">{act.user}</span>
                        {act.type === 'upload' ? 'triggered document ingestion' : act.type === 'query' ? 'executed chat query' : act.type === 'signup' ? 'created account' : 'performed operation'}
                      </p>
                      <p className="text-xs text-[#8E8D98] font-mono mt-0.5 max-w-[280px] sm:max-w-md truncate" title={act.target}>
                        {act.target}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E8D98] select-none whitespace-nowrap">
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

