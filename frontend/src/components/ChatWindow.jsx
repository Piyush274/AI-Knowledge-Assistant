import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'

/**
 * ChatWindow manages the active chat messages, rendering the streaming
 * assistant responses, auto-scrolling, and sending new messages.
 * 
 * @param {string} props.sessionId - The active session UUID
 */
function ChatWindow({ sessionId }) {
  // Use our streaming SSE hook to manage chat state
  const { messages, sendMessage, isGenerating, error } = useChat(sessionId)
  
  // Local state for the input message text box
  const [inputText, setInputText] = useState('')

  // Refs for auto-scrolling to the bottom of the container
  const scrollContainerRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Auto-scroll when messages array length increases (new messages sent/received)
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages.length])

  // Auto-scroll when assistant message content streams and updates text
  useEffect(() => {
    if (isGenerating && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        scrollToBottom('auto') // Use 'auto' speed for fast streaming updates
      }
    }
  }, [messages[messages.length - 1]?.content, isGenerating])

  // Form submit handler
  const handleSendSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isGenerating) return

    const textToSend = inputText
    setInputText('') // Clear input immediately for better UX
    await sendMessage(textToSend)
  }

  return (
    <div className="flex flex-col h-[78vh] bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl relative">
      
      {/* Scrollable Message Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8 select-none">
            <div className="text-4xl">💬</div>
            <h3 className="text-lg font-bold text-slate-200">Start a Conversation</h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Ask questions about your uploaded documents. The AI agent will search your database and cite its sources.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id || msg.created_at} message={msg} />
          ))
        )}

        {/* Live Generating/Typing State Indicator */}
        {isGenerating && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl px-4 py-2.5 shadow-lg">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1">
                Assistant
              </div>
              <div className="flex items-center gap-1.5 py-1 text-xs">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        {/* Error message boundary */}
        {error && (
          <div className="text-center p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg select-none">
            ⚠️ {error}
          </div>
        )}

        {/* Anchor point to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box Form */}
      <form 
        onSubmit={handleSendSubmit}
        className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center gap-3 relative z-10"
      >
        <input
          type="text"
          placeholder="Ask a question about your files..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isGenerating}
          className="flex-1 px-4 py-3 bg-slate-900/60 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="p-3 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white rounded-xl shadow-md shadow-blue-500/15 disabled:opacity-50 disabled:pointer-events-none"
        >
          {/* Simple Lucide Send-like Arrow Icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default ChatWindow
