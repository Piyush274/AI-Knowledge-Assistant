import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, RotateCw, BookOpen, Volume2, VolumeX, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import CitationTooltip from './CitationTooltip'
import client from '../api/client'

/**
 * Custom CodeBlock component with syntax container and copy button
 */
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#2D2E35] bg-[#1E1F24] text-[#E0DFE5] font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#282930] border-b border-[#35363F] text-[11px] text-[#A2A1AF]">
        <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-[#F3F2F8]">
        <code>{value}</code>
      </pre>
    </div>
  )
}

/**
 * Helper to recursively parse string nodes and replace inline citations [1], [2], [1, 2]
 * with interactive CitationTooltip pills.
 */
function parseChildrenWithCitations(children, citations, onSelectCitation) {
  if (!children) return children

  if (typeof children === 'string') {
    const parts = children.split(/(\[\d+(?:\s*,\s*\d+)*\])/g)
    if (parts.length === 1) return children

    return parts.map((part, index) => {
      const match = part.match(/^\[([\d\s,]+)\]$/)
      if (match) {
        const nums = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
        return (
          <span key={`inline-cit-group-${index}`} className="inline-flex items-center gap-0.5">
            {nums.map((citationNum, subIdx) => {
              const matchedCit = citations?.find(c => (c.source_index === citationNum)) || citations?.[citationNum - 1] || { source_index: citationNum }
              return (
                <CitationTooltip
                  key={`inline-cit-${index}-${citationNum}-${subIdx}`}
                  citation={matchedCit}
                  index={citationNum}
                  onClick={onSelectCitation}
                />
              )
            })}
          </span>
        )
      }
      return part
    })
  }

  if (Array.isArray(children)) {
    return children.map((child, idx) => {
      if (typeof child === 'string') {
        return parseChildrenWithCitations(child, citations, onSelectCitation)
      }
      return React.isValidElement(child) && child.props?.children
        ? React.cloneElement(child, {
            key: child.key || `child-${idx}`,
            children: parseChildrenWithCitations(child.props.children, citations, onSelectCitation)
          })
        : child
    })
  }

  if (React.isValidElement(children) && children.props?.children) {
    return React.cloneElement(children, {
      children: parseChildrenWithCitations(children.props.children, citations, onSelectCitation)
    })
  }

  return children
}

/**
 * MessageBubble renders user and assistant messages with full markdown formatting,
 * interactive inline citation pills, NotebookLM source drawer inspection, and Sarvam TTS.
 */
function MessageBubble({ message, onRegenerate, isGenerating = false, onSelectCitation }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle Sarvam AI Text-to-Speech playback
  const handleToggleSpeak = async () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.play()
      setIsPlayingAudio(true)
      return
    }

    try {
      setIsLoadingAudio(true)
      const response = await client.post('/speech/synthesize', {
        text: message.content,
        target_language_code: 'en-IN',
        speaker: 'priya'
      })

      if (response.data?.audio_base64) {
        const audioSrc = `data:audio/wav;base64,${response.data.audio_base64}`
        const audio = new Audio(audioSrc)
        audioRef.current = audio

        audio.onplay = () => setIsPlayingAudio(true)
        audio.onended = () => setIsPlayingAudio(false)
        audio.onpause = () => setIsPlayingAudio(false)
        audio.onerror = () => {
          setIsPlayingAudio(false)
          setIsLoadingAudio(false)
        }

        await audio.play()
      }
    } catch (err) {
      console.error('TTS synthesis error:', err)
      alert('Failed to synthesize speech. Please try again.')
    } finally {
      setIsLoadingAudio(false)
    }
  }

  // Render User Message Bubble (right-aligned pill)
  if (isUser) {
    return (
      <div className="flex justify-end w-full my-2">
        <div className="max-w-[85%] sm:max-w-[70%] bg-[#EFECE6] text-[#222328] border border-[#DDD8CF]/80 rounded-2xl px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <p className="text-sm sm:text-[14.5px] font-normal leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  const hasCitations = message.citations && message.citations.length > 0
  const citations = message.citations || []
  const rawContent = message.content || ''

  return (
    <div className="flex flex-col justify-start w-full my-3 text-[#1E1F24]">
      <div className="max-w-full space-y-3">
        
        {/* Main Assistant Markdown Content */}
        <div className="text-sm sm:text-[14.5px] leading-relaxed text-[#26272D]">
          {rawContent.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#18191D] mt-5 mb-2.5 tracking-tight">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18191D] mt-4 mb-2 tracking-tight">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#18191D] mt-3.5 mb-1.5 tracking-tight">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm sm:text-[14.5px] leading-relaxed text-[#26272D] my-2 font-normal">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside ml-5 my-2.5 space-y-1 text-[#26272D] text-sm sm:text-[14.5px]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-5 my-2.5 space-y-1 text-[#26272D] text-sm sm:text-[14.5px]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-1">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#141518]">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </strong>
                ),
                hr: () => <hr className="my-4 border-t border-[#E3DDD2]" />,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-[#C8C2B6] pl-3.5 py-1.5 my-2.5 italic text-[#55535C] bg-[#F5F2EB] rounded-r-xl">
                    {parseChildrenWithCitations(children, citations, onSelectCitation)}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E65F38] underline underline-offset-2 hover:text-[#C54A25] font-medium"
                  >
                    {children}
                  </a>
                ),
                code: ({ inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeString = String(children).replace(/\n$/, '')
                  if (!inline && match) {
                    return <CodeBlock language={match[1]} value={codeString} />
                  }
                  if (!inline && codeString.includes('\n')) {
                    return <CodeBlock language="" value={codeString} />
                  }
                  return (
                    <code className="px-1.5 py-0.5 bg-[#ECE7DE] text-[#1E1F24] font-mono text-xs rounded-md" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {rawContent}
            </ReactMarkdown>
          ) : isGenerating ? (
            /* Active Thinking Indicator */
            <div className="flex items-center gap-2.5 py-2.5 px-4 bg-white border border-[#E7E2D8] rounded-2xl w-fit shadow-sm my-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E65F38] animate-ping shrink-0" />
              <span className="text-xs font-medium text-[#73716D]">Thinking & generating response...</span>
              <span className="typewriter-cursor" />
            </div>
          ) : (
            /* Fallback retry card when response is empty */
            <div className="flex items-center gap-3 py-2.5 px-4 bg-[#FAF5F0] border border-[#F0E4D8] rounded-2xl text-xs text-[#8A6D56] w-fit my-1">
              <span>No response generated.</span>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message)}
                  className="font-semibold text-[#1E1F24] underline hover:text-[#E65F38] cursor-pointer"
                >
                  Click to retry
                </button>
              )}
            </div>
          )}

          {/* Typewriter Blinking Cursor while generating with text */}
          {isGenerating && rawContent.trim() && (
            <span className="typewriter-cursor" title="Typing..." />
          )}
        </div>

        {/* Real Document Citation Cards with Click-to-Inspect */}
        {hasCitations && (
          <div className="pt-2 pb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7882] mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#E65F38]" />
                <span>Referenced Knowledge Sources ({citations.length})</span>
              </div>
              <span className="text-[10px] text-[#8E8D98] normal-case hidden sm:inline">
                Click any source to inspect full context
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {citations.map((cit, idx) => {
                const sourceNum = cit.source_index || (idx + 1)
                const docName = cit.document_name || cit.filename || cit.source_name || "Document Source"
                const snippetText = cit.text_snippet || cit.snippet || cit.content || "Source excerpt retrieved for this query."

                return (
                  <div
                    key={`cit-card-${idx}`}
                    onClick={() => {
                      if (onSelectCitation) onSelectCitation(cit)
                    }}
                    className="group bg-white hover:bg-[#FAF8F5] rounded-2xl border border-[#E7E2D8] hover:border-[#FFB049]/60 p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-2 transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs font-bold text-[#E65F38] bg-[#FAF5F0] group-hover:bg-[#E65F38] group-hover:text-white px-1.5 py-0.5 rounded shrink-0 transition-colors">
                        [{sourceNum}]
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-[#18191D] truncate group-hover:text-[#E65F38] transition-colors" title={docName}>
                          {docName}
                        </h5>
                        <p className="text-[11px] text-[#7A7882] line-clamp-2 leading-relaxed mt-1">
                          "{snippetText}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F4F1EA] flex items-center justify-between text-[10px] text-[#8E8D98]">
                      <span className="font-mono truncate max-w-[130px]">
                        Chunk #{cit.chunk_index !== undefined ? cit.chunk_index : sourceNum}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[#FF7B59] group-hover:underline">
                        <span>Inspect</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Message Action Footer (Listen Aloud, Copy, Try again) */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1 text-[#7C7A85] select-none">
          
          {/* Sarvam AI Listen Aloud Button */}
          {message.content && !isGenerating && (
            <button
              onClick={handleToggleSpeak}
              disabled={isLoadingAudio}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1 rounded-md cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-amber-100/70 text-amber-800' 
                  : 'hover:text-[#1E1F24] hover:bg-[#EFEBE3]'
              }`}
              title={isPlayingAudio ? "Stop reading" : "Read aloud with Sarvam AI"}
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E65F38]" />
                  <span>Loading voice...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-amber-800">Stop audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#E65F38]" />
                  <span>Listen</span>
                </>
              )}
            </button>
          )}

          {/* Copy Button */}
          {message.content && !isGenerating && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-[#1E1F24] transition-colors px-2 py-1 rounded-md hover:bg-[#EFEBE3] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Try Again / Regenerate Button */}
          {onRegenerate && !isGenerating && (
            <button
              onClick={() => onRegenerate(message)}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-[#1E1F24] transition-colors px-2 py-1 rounded-md hover:bg-[#EFEBE3] cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default MessageBubble
