import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import UploadDropzone from '../components/UploadDropzone'

function DocumentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Redirect to login if no auth token is found
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  // Fetch user's documents list
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      // Endpoint GET /documents lists user-owned files
      const response = await client.get('/documents')
      return response.data
    },
    // Poll every 3 seconds to auto-refresh the parsing status of documents (e.g. from "processing" to "ready")
    refetchInterval: 3000,
    enabled: !!localStorage.getItem('token')
  })

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId) => {
      // Endpoint DELETE /documents/{id}
      await client.delete(`/documents/${docId}`)
    },
    onSuccess: () => {
      // Invalidate query to pull the fresh list
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
  })

  // Helper to get styling for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            Failed
          </span>
        )
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Processing
          </span>
        )
    }
  }

  // Format date helper
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
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 p-4 md:p-8 rounded-2xl border border-slate-900 shadow-2xl relative">
      {/* Decorative glows */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Title Header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Knowledge Resources Ingestion
          </h1>
          <p className="text-sm text-slate-400">
            Upload document files to embed and store them in the vector database for retrieval.
          </p>
        </div>

        {/* Upload Box Widget Component */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 select-none">
            Add New Resource
          </h2>
          <UploadDropzone onUploadSuccess={() => queryClient.invalidateQueries(['documents'])} />
        </div>

        {/* Catalog List inventory */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 select-none">
              Uploaded Documents Catalog
            </h2>
            <span className="text-xs text-slate-500 font-mono select-none">
              Total files: {documents.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-12 text-sm text-slate-500 animate-pulse">
                Loading resources inventory...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 select-none">
                <p className="text-lg">📭</p>
                <p className="text-sm font-bold text-slate-300 mt-2">No documents uploaded yet</p>
                <p className="text-xs text-slate-550 mt-1 max-w-xs mx-auto">
                  Drag and drop a file above to add items to your personal search space.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 text-xs font-semibold text-slate-400 border-b border-slate-850 select-none">
                    <th className="px-6 py-3.5">Filename</th>
                    <th className="px-6 py-3.5">Upload Date</th>
                    <th className="px-6 py-3.5">Ingestion Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg select-none">📄</span>
                          <span className="text-sm font-medium text-slate-200" title={doc.filename}>
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-450">
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
                          className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                          title="Delete document"
                        >
                          {/* Trash Can Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
    </div>
  )
}

export default DocumentsPage
