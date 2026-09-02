import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, FileText, PanelLeft } from 'lucide-react'
import client from '../api/client'
import UploadDropzone from '../components/UploadDropzone'
import Sidebar from '../components/Sidebar'

function DocumentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Redirect to login if no auth token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  // Fetch user's documents list
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await client.get('/documents/')
      return response.data
    },
    refetchInterval: 3000,
    enabled: !!localStorage.getItem('token')
  })

  // Delete document mutation with 0ms optimistic UI update
  const deleteMutation = useMutation({
    mutationFn: async (docId) => {
      await client.delete(`/documents/${docId}`)
    },
    onMutate: async (docId) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] })
      const previousDocs = queryClient.getQueryData(['documents']) || []
      queryClient.setQueryData(['documents'], (old = []) => old.filter(d => d.id !== docId))
      return { previousDocs }
    },
    onError: (err, docId, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(['documents'], context.previousDocs)
      }
      alert('Could not delete document. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
  })

  // Status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Ready
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Failed
          </span>
        )
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Processing
          </span>
        )
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex h-full w-full bg-[#FAF8F5] text-[#1E1F24] overflow-hidden select-none">
      
      {/* Reusable Left Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col h-full bg-[#FAF8F5] overflow-y-auto relative">
        
        {/* Top Action Header Bar */}
        <header className="px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#FAF8F5] z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[#65646E] hover:text-[#1E1F24] hover:bg-[#EFECE6] rounded-xl transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#1C1C1F] tracking-tight">
              Knowledge Documents
            </h1>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="flex-1 px-6 lg:px-10 py-4 max-w-5xl w-full mx-auto space-y-8">
          
          <div className="space-y-1">
            <p className="text-sm text-[#73716D]">
              Upload and vectorize your PDFs, text notes, or docs into the knowledge database for contextual retrieval.
            </p>
          </div>

          {/* Upload Box Widget */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#73716D] mb-4 select-none">
              Add New Resource
            </h2>
            <UploadDropzone onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['documents'] })} />
          </div>

          {/* Catalog List inventory */}
          <div className="bg-white border border-[#E7E2D8] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div className="px-6 py-4 border-b border-[#F0EBE2] flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#73716D] select-none">
                Knowledge Catalog ({documents.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="text-center py-12 text-xs text-[#73716D] animate-pulse">
                  Loading resources inventory...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-16 text-[#73716D]">
                  <p className="text-2xl mb-1">📭</p>
                  <p className="text-sm font-semibold text-[#1E1F24]">No documents uploaded yet</p>
                  <p className="text-xs text-[#73716D] mt-1 max-w-xs mx-auto">
                    Drag and drop a file above to add items to your personal search space.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] text-xs font-semibold text-[#73716D] border-b border-[#F0EBE2]">
                      <th className="px-6 py-3.5">Filename</th>
                      <th className="px-6 py-3.5">Upload Date</th>
                      <th className="px-6 py-3.5">Ingestion Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE2]">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-[#73716D]" />
                            <span className="text-sm font-medium text-[#1E1F24]" title={doc.filename}>
                              {doc.filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-[#73716D]">
                          {formatDate(doc.uploaded_at || doc.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
                                deleteMutation.mutate(doc.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-rose-50 text-[#8E8D98] hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

    </div>
  )
}

export default DocumentsPage
