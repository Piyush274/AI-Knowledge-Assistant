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
    return <span className="text-[#787680] font-mono text-xs">[{index}]</span>
  }

  return (
    <span className="relative inline-block group mx-0.5 select-none">
      {/* Citation Badge Trigger */}
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold font-mono bg-[#EAE6DE] hover:bg-[#DDD8CE] border border-[#DDD8CF] text-[#222328] rounded cursor-pointer transition-all">
        [{index}]
      </span>

      {/* Floating Tooltip Container */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-[#DDD8CF] rounded-xl p-3 shadow-xl hidden group-hover:block transition-all z-50 text-[#1E1F24] pointer-events-none text-left">
        {/* Source Header */}
        <span className="block text-[10px] font-semibold text-[#8C8A94] border-b border-[#F0ECE4] pb-1 mb-1.5 uppercase tracking-wide">
          Source Document
        </span>
        
        {/* Document Title */}
        <span className="block text-xs font-bold text-[#18191D] mb-1 truncate">
          📄 {citation.document_name || citation.filename || citation.source_name || "Unknown File"}
        </span>

        {/* Source Snippet Excerpt */}
        <span className="block text-[11px] text-[#55535C] leading-relaxed max-h-32 overflow-y-auto pr-1">
          "{citation.text_snippet || citation.snippet || citation.content || "No source excerpt available."}"
        </span>

        {/* Small arrow triangle pointing to badge */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white" />
      </span>
    </span>
  )
}

export default CitationTooltip

