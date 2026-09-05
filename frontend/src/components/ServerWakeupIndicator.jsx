import React, { useState, useEffect } from 'react'
import { Server, Sparkles, AlertCircle } from 'lucide-react'

export default function ServerWakeupIndicator() {
  const [isWaking, setIsWaking] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const handleStatusChange = (e) => {
      const waking = e.detail?.isWaking
      setIsWaking(waking)
      if (!waking) {
        setSeconds(0)
      }
    }

    window.addEventListener('render-server-status', handleStatusChange)
    return () => {
      window.removeEventListener('render-server-status', handleStatusChange)
    }
  }, [])

  useEffect(() => {
    let interval = null
    if (isWaking) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWaking])

  if (!isWaking) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 bg-[#1E1F24] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#373840] max-w-md backdrop-blur-md">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-5 h-5 border-2 border-[#FF7B59] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">
              Waking up Render Backend
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#2E2F37] text-[#FFB049] rounded-md">
              {seconds}s
            </span>
          </div>
          <p className="text-[11px] text-[#A5A4B2] mt-0.5 leading-snug">
            Render free tier spins down after inactivity. Cold-start takes ~30–50s. Please hold on!
          </p>
        </div>
      </div>
    </div>
  )
}
