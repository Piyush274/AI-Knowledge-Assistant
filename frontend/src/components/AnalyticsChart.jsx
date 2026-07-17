import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Mock daily metrics data (to be replaced by api data in Module 7)
const analyticsMockData = [
  { day: 'Mon', queries: 45, latency: 180, uploads: 12 },
  { day: 'Tue', queries: 78, latency: 210, uploads: 8 },
  { day: 'Wed', queries: 112, latency: 195, uploads: 15 },
  { day: 'Thu', queries: 95, latency: 240, uploads: 6 },
  { day: 'Fri', queries: 150, latency: 185, uploads: 22 },
  { day: 'Sat', queries: 88, latency: 150, uploads: 4 },
  { day: 'Sun', queries: 120, latency: 165, uploads: 18 }
]

/**
 * CustomTooltip designs the hover data panel to align with our slate dark theme.
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5">
        <p className="font-bold text-slate-100 mb-1 border-b border-slate-850 pb-1 font-mono">
          📅 {label}day Statistics
        </p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-4 justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              {/* Color Dot indicator */}
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-bold font-mono text-slate-100">
              {item.value} {item.name === 'Latency' ? 'ms' : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function AnalyticsChart() {
  return (
    <div className="w-full h-80 bg-slate-950/40 p-4 border border-slate-850 rounded-xl relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={analyticsMockData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          {/* Subtle grid lines */}
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis 
            dataKey="day" 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <YAxis 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          
          {/* Styled hover tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
          />

          {/* Gradients definitions for chart fills */}
          <defs>
            <linearGradient id="queriesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Queries Area */}
          <Area
            type="monotone"
            dataKey="queries"
            name="Chat Queries"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#queriesGrad)"
          />

          {/* Latency Area */}
          <Area
            type="monotone"
            dataKey="latency"
            name="Latency"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#latencyGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AnalyticsChart
