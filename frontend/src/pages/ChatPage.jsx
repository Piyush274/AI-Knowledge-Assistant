import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  BarChart3, 
  Folder, 
  Bell, 
  Share2, 
  Pencil, 
  Check, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft, 
  LogOut,
  MessageSquare,
  MessageSquarePlus
} from 'lucide-react'
import client from '../api/client'
import ChatWindow from '../components/ChatWindow'

function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  
  // Track active conversation session UUID
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [sessionTitleInput, setSessionTitleInput] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState(null)

  // Real logged-in user email
  const userEmail = localStorage.getItem('user_email') || 'User'
  const userInitial = userEmail.charAt(0).toUpperCase()

  // Redirect to login if no auth token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  // Cached data to eliminate 0-count flicker on initial load
  const cachedSessions = (() => {
    try { return JSON.parse(localStorage.getItem('cached_sessions') || '[]') } catch { return [] }
  })()
  const cachedDocs = (() => {
    try { return JSON.parse(localStorage.getItem('cached_documents') || '[]') } catch { return [] }
  })()

  // Fetch real list of historical chat sessions with instant cached initialData
  const { data: sessions = cachedSessions, isLoading: sessionsLoading } = useQuery({
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

  // Fetch real document count with instant cached initialData
  const { data: documents = cachedDocs, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await client.get('/documents/')
      const list = response.data || []
      localStorage.setItem('cached_documents', JSON.stringify(list))
      return list
    },
    initialData: cachedDocs.length > 0 ? cachedDocs : undefined,
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

  // Real Mutation to create a new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const title = "New Chat"
      const response = await client.post('/chat/sessions', { title })
      return response.data
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setActiveSessionId(newSession.id)
    }
  })

  // Real Mutation to delete a session with 0ms Optimistic UI Update
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionIdToDelete) => {
      await client.delete(`/chat/sessions/${sessionIdToDelete}`)
      return sessionIdToDelete
    },
    onMutate: async (sessionIdToDelete) => {
      // 1. Cancel any outgoing refetches to avoid overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ['sessions'] })

      // 2. Snapshot the previous sessions list
      const previousSessions = queryClient.getQueryData(['sessions']) || []

      // 3. Optimistically remove the deleted session immediately (0ms UI feedback)
      queryClient.setQueryData(['sessions'], (old = []) => {
        const updated = old.filter(s => s.id !== sessionIdToDelete)
        localStorage.setItem('cached_sessions', JSON.stringify(updated))
        return updated
      })

      // 4. Immediately switch active session if we're deleting the currently opened one
      if (activeSessionId === sessionIdToDelete) {
        const remaining = previousSessions.filter(s => s.id !== sessionIdToDelete)
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null)
      }

      return { previousSessions }
    },
    onError: (err, sessionIdToDelete, context) => {
      // Rollback cache if network fails
      if (context?.previousSessions) {
        queryClient.setQueryData(['sessions'], context.previousSessions)
        localStorage.setItem('cached_sessions', JSON.stringify(context.previousSessions))
      }
      console.error('Failed to delete session:', err)
      alert('Could not delete conversation. Please try again.')
    },
    onSettled: () => {
      // Re-sync with backend in background
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
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

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('cached_sessions')
    localStorage.removeItem('cached_documents')
    queryClient.clear()
    navigate('/')
  }

  return (
    <div className="flex h-full w-full bg-[#FAF8F5] text-[#1E1F24] overflow-hidden select-none">
      
      {/* ─────────────────── LEFT SIDEBAR (Dark Charcoal Obsidian) ─────────────────── */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72 lg:w-80' : 'w-0 -translate-x-full lg:w-0'
        } transition-all duration-300 ease-in-out bg-[#222328] text-[#E0DFE5] flex flex-col justify-between border-r border-[#2D2E35] shrink-0 overflow-hidden relative z-30`}
      >
        <div className="flex flex-col h-full p-4 lg:p-5">
          
          {/* Top Brand Header */}
          <div className="flex items-center justify-between pb-5 pt-1">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/chat')}>
              {/* Custom Origami Geometric Logo Icon */}
              <div className="w-8 h-8 relative flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <path d="M16 16L8 8C10 4 14 4 16 8L16 16Z" fill="#FF7B59" />
                  <path d="M16 16L24 8C28 10 28 14 24 16L16 16Z" fill="#FFB049" />
                  <path d="M16 16L24 24C22 28 18 28 16 24L16 16Z" fill="#9D65F6" />
                  <path d="M16 16L8 24C4 22 4 18 8 16L16 16Z" fill="#6C7280" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-1.5 leading-snug">
                AI Knowledge Assistant
              </span>
            </div>

            {/* Collapse Sidebar Button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-[#8E8D99] hover:text-white hover:bg-[#2F3037] rounded-lg transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* "+ New Chat" Button */}
          <div className="mb-4">
            <button
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-[#313238] hover:bg-[#3A3B42] active:scale-[0.98] text-[#E0DFE5] hover:text-white rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer border border-[#3A3B43]/50"
            >
              <Plus className="w-4 h-4 text-[#A5A4B2]" />
              <span>{createSessionMutation.isPending ? 'Creating...' : 'New Chat'}</span>
            </button>
          </div>

          {/* Navigation Items (Analytics, Documents) */}
          <div className="space-y-1 pb-4 border-b border-[#2E2F36]">
            
            {/* Analytics */}
            <button
              onClick={() => navigate('/analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                location.pathname === '/analytics'
                  ? 'bg-[#2E2F37] text-white font-semibold' 
                  : 'text-[#9D9CA8] hover:text-[#ECEBF2] hover:bg-[#2A2B31]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#FF7B59]" />
              <span>Analytics</span>
            </button>

            {/* Documents with real Document Count Badge */}
            <button
              onClick={() => navigate('/documents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                location.pathname === '/documents'
                  ? 'bg-[#2E2F37] text-white font-semibold' 
                  : 'text-[#9D9CA8] hover:text-[#ECEBF2] hover:bg-[#2A2B31]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Folder className="w-4 h-4 text-[#FFB049]" />
                <span>Documents</span>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#3A3B43] text-[#D0CFD9] rounded-full">
                {documents.length > 0 ? documents.length : (docsLoading ? '...' : '0')}
              </span>
            </button>
          </div>

          {/* Real Recent Chats Section */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 sidebar-scroll">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7E7D88] px-3 mb-2 flex items-center justify-between">
              <span>Recent Chats</span>
              <span className="text-[10px] text-[#8E8D98]">
                {sessions.length > 0 ? sessions.length : (sessionsLoading ? '...' : '0')}
              </span>
            </div>

            {sessionsLoading && sessions.length === 0 ? (
              <div className="text-xs text-[#7E7D88] px-3 py-3 animate-pulse">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-xs text-[#7E7D88] px-3 py-6 text-center space-y-2">
                <p>No conversations yet.</p>
                <button
                  onClick={() => createSessionMutation.mutate()}
                  className="text-xs text-white underline hover:text-[#FFB049] cursor-pointer"
                >
                  Start your first chat
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => {
                  const isActive = activeSessionId === session.id

                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#34353C] text-white shadow-sm font-semibold'
                          : 'text-[#9D9CA7] hover:text-white hover:bg-[#2A2B31]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 text-[#FF7B59]" />
                        <span className="truncate pr-1 select-none" title={session.title || 'Untitled Session'}>
                          {session.title || 'Untitled Session'}
                        </span>
                      </div>

                      {/* Instant Delete Session Button (Hover/Active) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSessionMutation.mutate(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-[#8E8D98] hover:text-rose-400 rounded-md transition-all cursor-pointer shrink-0 ml-1"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Real Bottom User Profile Section */}
          <div className="pt-3 border-t border-[#2E2F36] relative">
            <div 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#2A2B31] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#3D3E47] text-white font-semibold flex items-center justify-center text-xs shrink-0 border border-[#4F505B]">
                  {userInitial}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-[#E5E4EC] block truncate" title={userEmail}>
                    {userEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#2B2C33] border border-[#3A3B43] rounded-xl p-2 shadow-2xl z-50 text-xs text-[#E0DFE5]">
                <div className="px-3 py-2 border-b border-[#373840] text-[11px] text-[#8E8D98] truncate">
                  {userEmail}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>

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
                  {currentSession?.title || 'Knowledge Assistant'}
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
                disabled={createSessionMutation.isPending}
                className="mt-5 px-5 py-2.5 bg-[#1E1F24] hover:bg-[#111216] text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
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
