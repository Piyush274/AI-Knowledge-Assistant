import React, { useState, useRef } from 'react'
import client from '../api/client'

/**
 * UploadDropzone implements a drag-and-drop file uploader.
 * It sends files to `/documents/upload` using multipart/form-data
 * and reports progress in real-time.
 * 
 * @param {Function} props.onUploadSuccess - Callback to refresh file list on parent page
 */
function UploadDropzone({ onUploadSuccess }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  
  const fileInputRef = useRef(null)

  // Drag over handlers to toggle border highlights
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    setIsDragActive(false)
  }

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0])
    }
  }

  // Handle standard input click selection
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0])
    }
  }

  // Upload file core logic
  const handleUpload = async (file) => {
    // Basic frontend file type extension check (.txt, .md, .pdf, .docx)
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      setError('Unsupported file type. Please upload PDF, Markdown, Word (.docx) or Text files.')
      return
    }

    // Clear previous state
    setError(null)
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file) // Key name must match backend's parameter "file"

    try {
      await client.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Track progress percentage
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setProgress(percentCompleted)
        },
      })

      // Trigger list refresh in parent page
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err) {
      console.error('File upload failed:', err)
      setError(err.response?.data?.detail || 'Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Programmatically click input file selector when box is clicked
  const handleBoxClick = () => {
    if (!uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Box Trigger Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBoxClick}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] ${
          uploading ? 'pointer-events-none opacity-80' : ''
        } ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5'
            : 'border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-700'
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
        />

        {/* Upload Icon / Spinner */}
        <div className="text-3xl mb-3 select-none">
          {uploading ? (
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            '📤'
          )}
        </div>

        {uploading ? (
          <div className="w-full max-w-xs space-y-2">
            <p className="text-sm font-semibold text-slate-200">Uploading File...</p>
            {/* Progress Bar */}
            <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-mono">{progress}% complete</p>
          </div>
        ) : (
          <div className="space-y-1.5 select-none">
            <p className="text-sm font-bold text-slate-200">
              Drag & Drop file here, or <span className="text-blue-400 hover:text-blue-300">browse</span>
            </p>
            <p className="text-xs text-slate-500">
              Supports PDF, Word (.docx), Markdown, or Text files up to 25MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}

export default UploadDropzone
