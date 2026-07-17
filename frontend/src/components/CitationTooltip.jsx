import React from 'react'

/**
 * CitationTooltip renders an interactive citation marker.
 * When hovered, it shows a floating card with source details.
 * 
 * @param {Object} props.citation - The citation metadata containing document title and matching text
 * @param {number} props.index - The 1-based citation number/index
 */
function CitationTooltip({ citation, index }) {
  if (!citation) {
    return <span className="text-slate-400 font-mono">[{index}]</span>
  }

  return (
    <span className="relative inline-block group mx-0.5">
      {/* Citation Badge Trigger */}
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold font-mono bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded cursor-pointer hover:bg-blue-500/35 transition-all select-none">
        [{index}]
      </span>

      {/* Floating Glassmorphic Tooltip Container */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md hidden group-hover:block transition-all z-50 text-slate-200 pointer-events-none">
        
        {/* Source Header */}
        <span className="block text-xs font-semibold text-blue-400 border-b border-slate-800 pb-1.5 mb-1.5 uppercase tracking-wide">
          Source Document
        </span>
        
        {/* Document Title */}
        <span className="block text-xs font-bold text-slate-100 mb-1 truncate">
          📄 {citation.document_name || citation.source_name || "Unknown File"}
        </span>

        {/* Source Snippet Excerpt */}
        <span className="block text-[11px] text-slate-400 leading-relaxed max-h-32 overflow-y-auto pr-1">
          "{citation.text_snippet || citation.snippet || "No source excerpt available."}"
        </span>

        {/* Small arrow triangle pointing to badge */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  )
}

export default CitationTooltip
