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

/**
 * CustomTooltip for the warm minimalist aesthetic.
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#DDD8CF] rounded-xl p-3 shadow-xl text-xs space-y-1.5">
        <p className="font-bold text-[#1E1F24] mb-1 border-b border-[#F0EBE2] pb-1 font-mono">
          📅 {label}day Statistics
        </p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-4 justify-between">
            <span className="flex items-center gap-1.5 text-[#73716D]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-bold font-mono text-[#1E1F24]">
              {item.value} {item.name === 'Latency' ? 'ms' : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function AnalyticsChart({ data }) {
  return (
    <div className="w-full h-80 bg-[#FAF8F5] p-4 border border-[#E7E2D8] rounded-xl relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data || []}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EBE7DF" vertical={false} />
          
          <XAxis 
            dataKey="day" 
            stroke="#8E8D98" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <YAxis 
            stroke="#8E8D98" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#55535C' }}
          />

          <defs>
            <linearGradient id="queriesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E65F38" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E65F38" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E1F24" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1E1F24" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="queries"
            name="Chat Queries"
            stroke="#E65F38"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#queriesGrad)"
          />

          <Area
            type="monotone"
            dataKey="latency"
            name="Latency (ms)"
            stroke="#1E1F24"
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

