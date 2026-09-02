import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'

/**
 * CitationTooltip renders an interactive inline citation marker.
 * When hovered, it displays a rich floating card with the source document and excerpt.
 * When clicked, it triggers onClick to open the NotebookLM-style Source Inspector Drawer.
 * 
 * @param {Object} props.citation - The citation metadata containing document title and matching text
 * @param {number} props.index - The 1-based citation number/index
 * @param {function} props.onClick - Click handler to open the Source Inspector Drawer
 */
function CitationTooltip({ citation, index, onClick }) {
  if (!citation) {
    return (
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#EAE6DE] border border-[#DDD8CF] text-[#55535C] rounded mx-0.5">
        [{index}]
      </span>
    )
  }

  const fileName = citation.document_name || citation.filename || citation.source_name || "Knowledge Document"
  const snippet = citation.text_snippet || citation.snippet || citation.content || "Source excerpt retrieved for this response."

  return (
    <span className="relative inline-block group mx-0.5 select-none align-baseline">
      {/* Citation Badge Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (onClick) onClick(citation)
        }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono font-bold bg-[#FAF5F0] hover:bg-[#F3ECE2] active:scale-95 border border-[#E8DFC9] hover:border-[#FFB049] text-[#E65F38] hover:text-[#C54A25] rounded-md transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        title="Click to inspect source context"
      >
        <span>[{index}]</span>
      </button>

      {/* Floating Hover Tooltip Container */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-[#DDD8CF] rounded-2xl p-3.5 shadow-2xl hidden group-hover:block transition-all z-50 text-[#1E1F24] pointer-events-none text-left animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with File Icon & Name */}
        <span className="flex items-center justify-between border-b border-[#F0ECE4] pb-1.5 mb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#18191D] truncate max-w-[180px]">
            <FileText className="w-3.5 h-3.5 text-[#E65F38] shrink-0" />
            <span className="truncate">{fileName}</span>
          </span>
          <span className="text-[10px] font-mono text-[#8C8A94] uppercase tracking-wide shrink-0">
            Source [{index}]
          </span>
        </span>

        {/* Source Snippet Excerpt */}
        <span className="block text-[11px] text-[#55535C] leading-relaxed max-h-24 overflow-hidden italic line-clamp-3">
          "{snippet}"
        </span>

        {/* Click Instruction Footer */}
        <span className="mt-2 pt-1.5 border-t border-[#F4F1EA] flex items-center justify-between text-[10px] text-[#FF7B59] font-medium">
          <span>Click badge to open inspector</span>
          <ExternalLink className="w-3 h-3" />
        </span>

        {/* Small arrow triangle pointing to badge */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white" />
      </span>
    </span>
  )
}

export default CitationTooltip
