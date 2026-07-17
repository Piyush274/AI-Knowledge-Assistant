import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import ChatWindow from '../components/ChatWindow'

function ChatPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Track the active conversation session UUID
  const [activeSessionId, setActiveSessionId] = useState(null)

  // Redirect to login page if no auth token is found in browser
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  // Fetch the list of historical chat sessions belonging to the logged-in user
  const { data: sessions = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await client.get('/chat/sessions')
      return response.data
    },
    // Only fetch if token exists
    enabled: !!localStorage.getItem('token')
  })

  // Mutation to create a new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      // Create a default session name based on current date & time
      const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const title = `Session (${dateStr})`
      
      const response = await client.post('/chat/sessions', { title })
      return response.data
    },
    onSuccess: (newSession) => {
      // Refresh the sessions list and set the newly created session as active
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setActiveSessionId(newSession.id)
    }
  })

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    queryClient.clear() // Wipe React Query Cache
    navigate('/')
  }

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 flex rounded-2xl overflow-hidden border border-slate-900 shadow-2xl relative">
      
      {/* Background ambient light effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar - Chat Sessions List */}
      <aside className="w-80 border-r border-slate-900 bg-slate-900/30 flex flex-col z-10">
        
        {/* Sidebar Header & Create Session Button */}
        <div className="p-4 border-b border-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Conversations
            </h2>
            {/* Simple logout badge */}
            <button 
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <button
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 transition-all rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/15"
          >
            <span>+</span> New Chat
          </button>
        </div>

        {/* Sessions Scroll List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No sessions found. Create one to begin.
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = activeSessionId === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md shadow-slate-950/40'
                      : 'hover:bg-slate-900/50 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <span className="block text-sm font-medium truncate">
                      💬 {session.title || 'Untitled Session'}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Subtle hover bullet indicator */}
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive ? 'bg-indigo-500 scale-100' : 'bg-transparent group-hover:bg-slate-700 scale-0 group-hover:scale-100'
                  }`} />
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Main Panel - Active Chat Screen */}
      <main className="flex-1 flex flex-col justify-stretch p-4 md:p-6 bg-slate-950/60 z-10">
        {activeSessionId ? (
          <ChatWindow sessionId={activeSessionId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-900 rounded-2xl bg-slate-900/10">
            <div className="text-5xl animate-bounce mb-4 select-none">🤖</div>
            <h2 className="text-xl font-bold text-slate-200">AI Knowledge Assistant Workspace</h2>
            <p className="text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
              Create a new conversation session or select an existing session from the sidebar to query your RAG knowledge base.
            </p>
          </div>
        )}
      </main>

    </div>
  )
}

export default ChatPage
