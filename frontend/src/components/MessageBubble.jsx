import React from 'react'
import CitationTooltip from './CitationTooltip'

/**
 * MessageBubble renders individual message bubbles (user or assistant).
 * For assistant messages, it parses citations (e.g. [1]) and wraps them with tooltips.
 * 
 * @param {Object} props.message - The message object containing { role, content, citations }
 */
function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  // Render User Message Bubble
  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[75%] bg-blue-600 border border-blue-500 text-white rounded-2xl px-4 py-2.5 shadow-md shadow-blue-500/10">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  // Render Assistant Message Bubble (with parsed citation numbers)
  const parseContentWithCitations = (content, citations = []) => {
    if (!content) return null

    // Regex to split on citation markers like [1], [2], etc.
    const parts = content.split(/(\[\d+\])/g)

    return parts.map((part, index) => {
      // Check if this segment is a citation marker
      const match = part.match(/^\[(\d+)\]$/)
      if (match) {
        const citationNumber = parseInt(match[1], 10)
        
        // Find matching citation object (1-based index mapped to 0-based array)
        const citation = citations && citations[citationNumber - 1]

        return (
          <CitationTooltip
            key={`cit-${index}`}
            citation={citation}
            index={citationNumber}
          />
        )
      }

      // Plain text segment
      return part
    })
  }

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[80%] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl px-4 py-2.5 shadow-lg relative">
        <div className="text-xs font-semibold text-indigo-400 mb-1.5 uppercase tracking-wider select-none">
          Assistant
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {parseContentWithCitations(message.content, message.citations)}
        </p>

        {/* Display citations card footer if citations list exists */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1 select-none">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 block mb-1">
              Sources & Citations:
            </span>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((cit, idx) => (
                <div 
                  key={`footer-cit-${idx}`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] rounded text-slate-400"
                >
                  <span className="font-bold text-blue-400 font-mono">[{idx + 1}]</span>
                  <span className="truncate max-w-[150px]" title={cit.document_name || cit.source_name}>
                    {cit.document_name || cit.source_name || "Document"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
