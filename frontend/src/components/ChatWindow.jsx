import React, { useState, useRef, useEffect } from 'react'
import { 
  ArrowUp, 
  Sparkles,
  Check,
  FileText,
  Mic,
  MicOff,
  Loader2,
  Square,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  Zap,
  Cpu
} from 'lucide-react'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'
import SourceInspectorDrawer from './SourceInspectorDrawer'
import client from '../api/client'

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', badge: 'Fast & Smart ⚡', speed: '500+ tok/s', icon: '⚡' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq', badge: 'Ultra Instant 🚀', speed: '800+ tok/s', icon: '🚀' },
  { id: 'models/gemini-2.5-flash', name: 'Gemini Flash', provider: 'Google', badge: 'Cloud API ✨', speed: '60 tok/s', icon: '✨' },
]

/**
 * ChatWindow connects directly to real backend streaming SSE via useChat hook,
 * handles Sarvam AI Speech-to-Text microphone recording, model switching, and displays quota limit warnings.
 */
function ChatWindow({ sessionId, onSessionTitleUpdated }) {
  const { messages, sendMessage, isGenerating, isLoadingHistory, error } = useChat(sessionId)
  
  const [inputText, setInputText] = useState('')
  const [dismissQuotaError, setDismissQuotaError] = useState(false)
  const [inspectedCitation, setInspectedCitation] = useState(null)

  // Model switching state with localStorage persistence
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('ai_selected_model') || 'llama-3.3-70b-versatile'
  })
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId)
    localStorage.setItem('ai_selected_model', modelId)
    setIsModelMenuOpen(false)
  }

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // Message scroll refs
  const scrollContainerRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Auto scroll helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages.length])

  useEffect(() => {
    if (isGenerating && messages.length > 0) {
      scrollToBottom('auto')
    }
  }, [messages[messages.length - 1]?.content, isGenerating])

  // Reset dismissed quota error on new session or query
  useEffect(() => {
    setDismissQuotaError(false)
  }, [sessionId, error])

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Start browser audio recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Stop all audio stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        if (audioBlob.size === 0) {
          setIsRecording(false)
          return
        }

        // Send to backend for Sarvam AI transcription
        try {
          setIsTranscribing(true)
          const formData = new FormData()
          formData.append('file', audioBlob, 'speech.webm')
          formData.append('language_code', 'en-IN')
          formData.append('model', 'saarika:v2.5')

          const res = await client.post('/speech/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          if (res.data?.transcript) {
            setInputText((prev) => (prev ? `${prev} ${res.data.transcript}` : res.data.transcript))
          }
        } catch (transcribeErr) {
          console.error('Transcription failed:', transcribeErr)
          alert('Could not transcribe audio. Please try speaking again.')
        } finally {
          setIsTranscribing(false)
          setIsRecording(false)
        }
      }

      mediaRecorder.start(250) // collect chunks every 250ms
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied or error:', err)
      alert('Microphone permission is required to use voice input.')
      setIsRecording(false)
    }
  }

  // Stop browser audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Handle Voice / Send button click
  const handleVoiceOrSend = (e) => {
    e.preventDefault()
    if (inputText.trim()) {
      handleSendSubmit(e)
    } else if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Form submit handler
  const handleSendSubmit = async (e) => {
    e?.preventDefault()
    if (!inputText.trim() || isGenerating) return

    const textToSend = inputText
    setInputText('')
    await sendMessage(textToSend, selectedModel)
    if (onSessionTitleUpdated) {
      onSessionTitleUpdated()
    }
  }

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendSubmit(e)
    }
  }

  const isQuotaError = Boolean(
    error && (
      error.type === 'quota' || 
      (typeof error === 'string' && (error.includes('429') || error.toLowerCase().includes('quota'))) ||
      (typeof error === 'object' && error.message && (String(error.message).includes('429') || String(error.message).toLowerCase().includes('quota')))
    )
  )
  const errorMessage = error ? (typeof error === 'object' ? error.message || '' : String(error)) : ''
  const currentModelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

  return (
    <div className="flex flex-col h-full w-full justify-between overflow-hidden relative">
      
      {/* ─────────────────── REAL MESSAGE STREAM SCROLL CONTAINER ─────────────────── */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-1 sm:px-2 py-4 space-y-4 no-scrollbar"
      >
        {isLoadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none my-auto">
            <Loader2 className="w-8 h-8 animate-spin text-[#E65F38] mb-3" />
            <span className="text-xs font-medium text-[#7A7882]">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none my-auto">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0DBD0] flex items-center justify-center text-2xl shadow-sm mb-4">
              ✨
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl text-[#1E1F24]">What would you like to explore?</h3>
            <p className="text-xs sm:text-sm text-[#7A7882] max-w-md mt-2 leading-relaxed">
              Ask questions about your uploaded documents, search vector embeddings, or use the microphone to talk with Sarvam AI.
            </p>

            {/* Quick suggested prompt buttons */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-6">
              {[
                "Summarize the key takeaways from my files",
                "What are the main topics covered?",
                "Extract important action items"
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt)
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3EFE9] border border-[#E2DDD3] text-xs text-[#55535C] hover:text-[#1E1F24] transition-all shadow-sm cursor-pointer text-left"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user'
            const nextMsg = messages[idx + 1]
            const isLastMsg = idx === messages.length - 1
            const userHasNoAssistantReply = isUser && (!nextMsg || nextMsg.role === 'user')

            return (
              <React.Fragment key={msg.id || msg.created_at || idx}>
                <MessageBubble 
                  message={msg}
                  isGenerating={isGenerating && isLastMsg && msg.role === 'assistant'}
                  onSelectCitation={(cit) => setInspectedCitation(cit)}
                  onRegenerate={() => {
                    const promptToRetry = msg.role === 'user' 
                      ? msg.content 
                      : (messages.slice(0, idx).reverse().find(m => m.role === 'user')?.content || msg.content)
                    sendMessage(promptToRetry, selectedModel)
                  }}
                />
              </React.Fragment>
            )
          })
        )}



        {/* Quota Limit / Error Notification Card */}
        {error && !dismissQuotaError && (
          <div className={`p-4 rounded-2xl border shadow-sm my-3 select-none transition-all ${
            isQuotaError 
              ? 'bg-amber-50/90 border-amber-200 text-amber-900' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {isQuotaError ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <span className="text-base">⚠️</span>
                )}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider">
                    {isQuotaError ? 'Request Quota Limit Reached' : 'Query Processing Issue'}
                  </h5>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {errorMessage || 'Rate limit reached. Please wait a moment before sending another prompt.'}
                  </p>
                  {isQuotaError && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1.5">
                      Limit: 20 queries/minute per user. Cooldown is active.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDismissQuotaError(true)}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer text-current opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─────────────────── CLEAN FLOATING PROMPT INPUT CARD ─────────────────── */}
      <div className="pt-2 pb-1 shrink-0">
        <div className="w-full bg-[#F3EFE9] border border-[#E2DDD3] rounded-[22px] p-3 shadow-[0_10px_25px_rgba(0,0,0,0.03)] focus-within:border-[#C5C0B5] transition-all">
          
          {/* Active Voice Recording / Transcribing Indicator Banner */}
          {isRecording ? (
            <div className="flex items-center justify-between px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl mb-2 text-rose-800 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-semibold">Listening... Speak into your microphone</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm"
              >
                Stop & Transcribe
              </button>
            </div>
          ) : isTranscribing ? (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-2 text-amber-800 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Transcribing voice with Sarvam AI (Saarika)...</span>
            </div>
          ) : null}

          {/* Textarea / Input */}
          <form onSubmit={handleSendSubmit}>
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating || isRecording || isTranscribing}
              placeholder={isRecording ? "Listening..." : "Ask me anything or use the microphone....."}
              className="w-full bg-transparent border-0 text-[#1E1F24] placeholder-[#8A8892] text-sm sm:text-[15px] focus:outline-none resize-none px-2 pt-1 pb-1 leading-relaxed"
            />

            {/* Bottom Row: Model Switcher & Sarvam Voice / Action Button */}
            <div className="flex items-center justify-between pt-1 px-1">
              
              {/* Left Action: Interactive Model Switcher Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white border border-[#DDD8CE] text-xs font-medium text-[#3A3940] hover:text-[#1E1F24] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  title="Click to switch AI Model"
                >
                  <span className="text-xs">{currentModelConfig?.icon || '⚡'}</span>
                  <span className="font-medium text-[12px]">{currentModelConfig?.name || 'Llama 3.3 70B'}</span>
                  <span className="text-[10px] text-[#8E8D98] font-mono">({currentModelConfig?.provider})</span>
                  <ChevronDown className={`w-3 h-3 text-[#8E8D98] transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isModelMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsModelMenuOpen(false)} 
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl border border-[#E2DDD3] shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[#8E8D98] uppercase tracking-wider">
                        Select AI Engine
                      </div>
                      {AVAILABLE_MODELS.map((m) => {
                        const isSelected = selectedModel === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-[#F3EFE9] text-[#1E1F24] font-medium' 
                                : 'hover:bg-[#FAF7F2] text-[#55535C]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{m.icon}</span>
                              <div>
                                <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                                  {m.name}
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white border border-[#E0DBD0] text-[#7A7882] font-mono">
                                    {m.provider}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#8E8D98] mt-0.5">{m.badge} • {m.speed}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#E65F38]" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Right Action: Soundwave Mic / Stop / Submit Circle Button */}
              <button
                type="button"
                onClick={handleVoiceOrSend}
                disabled={isGenerating || isTranscribing}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                  isRecording 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                    : 'bg-[#222328] hover:bg-[#16171B] text-white active:scale-95'
                }`}
                title={
                  inputText.trim() 
                    ? "Send message" 
                    : isRecording 
                      ? "Click to stop recording" 
                      : "Click to record voice with Sarvam AI"
                }
              >
                {inputText.trim() ? (
                  <ArrowUp className="w-4 h-4 text-white" />
                ) : isTranscribing ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : isRecording ? (
                  <Square className="w-3.5 h-3.5 text-white fill-white" />
                ) : (
                  /* Soundwave Bars Icon matching screenshot */
                  <div className="flex items-center gap-[2.5px] px-1">
                    <span className="w-[2.5px] h-3 bg-white rounded-full" />
                    <span className="w-[2.5px] h-5 bg-white rounded-full" />
                    <span className="w-[2.5px] h-3.5 bg-white rounded-full" />
                    <span className="w-[2.5px] h-4.5 bg-white rounded-full" />
                    <span className="w-[2.5px] h-2.5 bg-white rounded-full" />
                  </div>
                )}
              </button>

            </div>
          </form>

        </div>
      </div>

      {/* NotebookLM-Style Source Inspector Drawer */}
      <SourceInspectorDrawer 
        citation={inspectedCitation}
        onClose={() => setInspectedCitation(null)}
      />

    </div>
  )
}

export default ChatWindow
