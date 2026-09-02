import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
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

  // Drag over handlers
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
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      setError('Unsupported file type. Please upload PDF, Markdown, Word (.docx) or Text files.')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      await client.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setProgress(percentCompleted)
        },
      })

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
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[190px] ${
          uploading ? 'pointer-events-none opacity-80' : ''
        } ${
          isDragActive
            ? 'border-[#1E1F24] bg-[#EBE7DF] shadow-md'
            : 'border-[#DDD8CF] bg-[#F7F4EE] hover:bg-[#F2EFE8] hover:border-[#B5B1A8]'
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
        <div className="mb-3 select-none">
          {uploading ? (
            <div className="w-10 h-10 border-2 border-[#1E1F24] border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#DDD8CF] flex items-center justify-center text-[#1E1F24] shadow-sm">
              <UploadCloud className="w-6 h-6 text-[#1E1F24]" />
            </div>
          )}
        </div>

        {uploading ? (
          <div className="w-full max-w-xs space-y-2">
            <p className="text-sm font-semibold text-[#1E1F24]">Uploading & Embedding...</p>
            {/* Progress Bar */}
            <div className="w-full bg-[#E5E0D6] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#1E1F24] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[#7A7882] font-mono">{progress}% complete</p>
          </div>
        ) : (
          <div className="space-y-1.5 select-none">
            <p className="text-sm font-semibold text-[#1E1F24]">
              Drag & drop document here, or <span className="underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-[#7A7882]">
              Supports PDF, Word (.docx), Markdown, or Text files up to 25MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs text-center">
          {error}
        </div>
      )}
    </div>
  )
}

export default UploadDropzone

