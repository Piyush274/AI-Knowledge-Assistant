import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function Login() {
  const { login, signup, loading, error } = useAuth()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false)

  useEffect(() => {
    if (searchParams.get('session_expired') === 'true') {
      setSessionExpiredNotice(true)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSessionExpiredNotice(false)
    if (isSignUp) {
      await signup(email, password)
    } else {
      await login(email, password)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#FAF8F5] text-[#1E1F24] p-6 select-none">
      
      {/* Centered Luxury Card */}
      <div className="w-full max-w-md bg-white border border-[#E7E2D8] rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
              <path d="M16 16L8 8C10 4 14 4 16 8L16 16Z" fill="#FF7B59" />
              <path d="M16 16L24 8C28 10 28 14 24 16L16 16Z" fill="#FFB049" />
              <path d="M16 16L24 24C22 28 18 28 16 24L16 16Z" fill="#9D65F6" />
              <path d="M16 16L8 24C4 22 4 18 8 16L16 16Z" fill="#6C7280" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-[#1C1C1F] tracking-tight">
            {isSignUp ? 'Create your Account' : 'Welcome to AI Knowledge Assistant'}
          </h1>
          <p className="text-xs sm:text-sm text-[#73716D]">
            {isSignUp
              ? 'Join to start researching and managing your knowledge space'
              : 'Enter your credentials to access your personal assistant'}
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs text-center flex items-center justify-center gap-2">
            <span>⏱️</span>
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#73716D]">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD8CF] rounded-xl text-[#1E1F24] placeholder-[#9D9CA8] text-sm focus:outline-none focus:border-[#1E1F24] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#73716D]">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#DDD8CF] rounded-xl text-[#1E1F24] placeholder-[#9D9CA8] text-sm focus:outline-none focus:border-[#1E1F24] transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1E1F24] hover:bg-[#111216] active:scale-[0.98] transition-all rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : isSignUp ? (
              'Sign Up'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Form Toggle Switch */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setSessionExpiredNotice(false)
            }}
            className="text-xs text-[#73716D] hover:text-[#1E1F24] transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login