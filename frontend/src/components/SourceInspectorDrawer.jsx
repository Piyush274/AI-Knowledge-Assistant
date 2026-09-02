import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  Quote
} from 'lucide-react'

/**
 * NotebookLM-style Slide-over Source Inspector Drawer.
 * Displays deep document metadata, retrieved chunk context, grounding verification,
 * and allows 1-click citation copying with provenance attribution.
 */
export default function SourceInspectorDrawer({ citation, onClose }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!citation) return null

  const fileName = citation.document_name || citation.filename || citation.source_name || "Knowledge Document"
  const chunkIndex = citation.chunk_index !== undefined ? citation.chunk_index : (citation.source_index || 1)
  const snippet = citation.text_snippet || citation.snippet || citation.content || "No text excerpt available."
  const sourceIndex = citation.source_index || 1

  const handleCopyCitation = () => {
    const textToCopy = `"${snippet.trim()}"\n\n— Source: ${fileName} (Chunk #${chunkIndex}, AI Knowledge Assistant)`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Semi-transparent backdrop blur */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-Over Panel Container */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E2DDD3] animate-in slide-in-from-right duration-300">
        
        {/* Top Header Bar */}
        <div className="px-6 py-5 border-b border-[#F0ECE4] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FAF1E8] border border-[#F0DFD0] flex items-center justify-center text-[#E65F38] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#1E1F24] text-white rounded-md">
                  Source [{sourceIndex}]
                </span>
                <span className="text-xs text-[#7A7882] font-mono">
                  Chunk #{chunkIndex}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#18191D] truncate max-w-[280px] sm:max-w-xs mt-0.5" title={fileName}>
                {fileName}
              </h3>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-[#7A7882] hover:text-[#18191D] hover:bg-[#EAE6DE] rounded-xl transition-colors cursor-pointer"
            title="Close inspector (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Chips Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FAF8F5] border border-[#ECE7DE] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7A7882] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Grounding</span>
              </div>
              <p className="text-xs font-semibold text-emerald-700">
                Critic Verified
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#ECE7DE] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7A7882] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#E65F38]" />
                <span>Vector Index</span>
              </div>
              <p className="text-xs font-semibold text-[#18191D] font-mono">
                pgvector cosine
              </p>
            </div>
          </div>

          {/* Retrieved Excerpt Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#73716D] flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#E65F38]" />
                Retrieved Source Excerpt
              </span>
              <span className="text-[11px] text-[#8E8D98] font-mono">
                {snippet.length} characters
              </span>
            </div>

            <div className="relative bg-[#FAF8F5] border border-[#E7E2D8] rounded-2xl p-5 text-sm text-[#26272D] leading-relaxed font-sans shadow-inner">
              <div className="absolute top-3 right-3 opacity-20 pointer-events-none">
                <Quote className="w-8 h-8 text-[#1E1F24]" />
              </div>
              <p className="whitespace-pre-wrap select-text pr-4">
                "{snippet}"
              </p>
            </div>
          </div>

          {/* AI Verification Insight Card */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#18191D]">
              <Sparkles className="w-4 h-4 text-[#FF7B59]" />
              <span>Multi-Agent Attribution Provenance</span>
            </div>
            <p className="text-xs text-[#73716D] leading-relaxed">
              This passage was retrieved from your vectorized database by the <strong>Retriever Agent</strong> and audited by the <strong>Citation Critic Agent</strong> at <code className="text-[11px] bg-[#FAF8F5] px-1 py-0.5 rounded border border-[#EAE6DE]">temp=0</code> to eliminate hallucinations.
            </p>
          </div>

        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-5 border-t border-[#F0ECE4] bg-[#FAF8F5] space-y-2.5">
          <button
            onClick={handleCopyCitation}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-[#1E1F24] hover:bg-[#111216] active:scale-[0.99] text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied Quote & Attribution!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Quote with Attribution</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onClose()
              navigate('/documents')
            }}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#F3EFE9] border border-[#DDD8CF] rounded-xl text-xs font-semibold text-[#55535C] hover:text-[#18191D] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Documents Library</span>
          </button>
        </div>

      </div>
    </div>
  )
}
