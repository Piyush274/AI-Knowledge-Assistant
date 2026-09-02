import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Pencil, 
  Check, 
  PanelLeft
} from 'lucide-react'
import client from '../api/client'
import ChatWindow from '../components/ChatWindow'
import Sidebar from '../components/Sidebar'

function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  
  // Track active conversation session UUID
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [sessionTitleInput, setSessionTitleInput] = useState('')

  // Redirect to login if no auth token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  // If navigated here with a selected session in router state, pick it up
  useEffect(() => {
    if (location.state?.selectedSessionId) {
      setActiveSessionId(location.state.selectedSessionId)
    }
  }, [location.state])

  // Cached data to eliminate 0-count flicker on initial load
  const cachedSessions = (() => {
    try { return JSON.parse(localStorage.getItem('cached_sessions') || '[]') } catch { return [] }
  })()

  // Fetch real list of historical chat sessions with instant cached initialData
  const { data: sessions = cachedSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await client.get('/chat/sessions')
      const list = response.data || []
      localStorage.setItem('cached_sessions', JSON.stringify(list))
      return list
    },
    initialData: cachedSessions.length > 0 ? cachedSessions : undefined,
    enabled: !!localStorage.getItem('token')
  })

  // Auto-select first real session if available
  useEffect(() => {
    if (sessions.length > 0) {
      if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
        setActiveSessionId(sessions[0].id)
      }
    }
  }, [sessions, activeSessionId])

  // Get active session object from real sessions
  const currentSession = sessions.find(s => s.id === activeSessionId) || (sessions.length > 0 ? sessions[0] : null)

  // 0ms Optimistic Session Creation for "+ Create Conversation" button
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post('/chat/sessions', { title: 'New Chat' })
      return response.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      const previousSessions = queryClient.getQueryData(['sessions']) || []
      
      const tempId = `temp-${Date.now()}`
      const optimisticSession = {
        id: tempId,
        title: 'New Chat',
        created_at: new Date().toISOString(),
        is_temp: true
      }

      const updated = [optimisticSession, ...previousSessions]
      queryClient.setQueryData(['sessions'], updated)
      localStorage.setItem('cached_sessions', JSON.stringify(updated))

      setActiveSessionId(tempId)

      return { previousSessions, tempId }
    },
    onSuccess: (newSession, variables, context) => {
      if (context?.tempId) {
        queryClient.setQueryData(['sessions'], (old = []) => 
          old.map(s => s.id === context.tempId ? newSession : s)
        )
        const updated = (queryClient.getQueryData(['sessions']) || []).map(s => s.id === context.tempId ? newSession : s)
        localStorage.setItem('cached_sessions', JSON.stringify(updated))

        setActiveSessionId((prev) => (prev === context.tempId ? newSession.id : prev))
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions)
        localStorage.setItem('cached_sessions', JSON.stringify(context.previousSessions))
      }
      console.error('Failed to create session:', err)
      alert('Could not create conversation. Please try again.')
    }
  })

  // Handle session title rename locally and on backend
  const handleSaveTitle = async () => {
    setEditingTitle(false)
    if (!sessionTitleInput.trim() || !currentSession) return
    const newTitle = sessionTitleInput.trim()
    try {
      await client.patch(`/chat/sessions/${currentSession.id}`, { title: newTitle })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } catch (err) {
      console.error('Failed to update session title:', err)
    }
  }

  return (
    <div className="flex h-full w-full bg-[#FAF8F5] text-[#1E1F24] overflow-hidden select-none">
      
      {/* Reusable Left Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
      />

      {/* ─────────────────── MAIN WORKSPACE (Warm Off-White Canvas) ─────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-[#FAF8F5] overflow-hidden relative">
        
        {/* Top Action Header Bar */}
        <header className="px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#FAF8F5] z-10">
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Open Sidebar button when collapsed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[#65646E] hover:text-[#1E1F24] hover:bg-[#EFECE6] rounded-xl transition-colors cursor-pointer mr-1"
                title="Open Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Real Editorial Serif Title */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionTitleInput}
                  onChange={(e) => setSessionTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="text-2xl lg:text-3xl font-serif text-[#1C1C1F] bg-white border border-[#DDD8CF] rounded-lg px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1E1F24]"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 group min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#1C1C1F] tracking-tight truncate">
                  {currentSession?.title || 'AI Knowledge Assistant'}
                </h1>
                
                {/* Pencil Edit Icon Button */}
                {currentSession && (
                  <button
                    onClick={() => {
                      setSessionTitleInput(currentSession?.title || 'New Conversation')
                      setEditingTitle(true)
                    }}
                    className="w-7 h-7 rounded-full border border-[#DDD8CF] text-[#78767D] hover:text-[#1C1C1F] hover:border-[#1C1C1F] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Rename chat"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Chat Area Content Component */}
        <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-10 pb-4">
          {activeSessionId ? (
            <ChatWindow 
              sessionId={activeSessionId} 
              onSessionTitleUpdated={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none my-auto">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0DBD0] flex items-center justify-center text-2xl shadow-sm mb-4">
                ✨
              </div>
              <h3 className="font-serif text-2xl text-[#1E1F24]">Start a New Session</h3>
              <p className="text-xs sm:text-sm text-[#7A7882] max-w-sm mt-2 leading-relaxed">
                Create a conversation session to query your documents, or select an existing session from the sidebar.
              </p>
              <button
                onClick={() => createSessionMutation.mutate()}
                className="mt-5 px-5 py-2.5 bg-[#1E1F24] hover:bg-[#111216] active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all"
              >
                + Create Conversation
              </button>
            </div>
          )}
        </div>

      </main>

    </div>
  )
}

export default ChatPage
