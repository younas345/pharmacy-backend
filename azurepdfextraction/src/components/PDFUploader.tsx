import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { extractPDFInfo, ExtractedPDFData, ProgressUpdate } from '../services/azureDocumentIntelligence'
import './PDFUploader.css'

interface PDFUploaderProps {
  onExtractionComplete: (data: ExtractedPDFData) => void
  onError: (error: string | null) => void
  onLoading: (loading: boolean) => void
  onProgress?: (progress: ProgressUpdate) => void
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
}

const isValidFileType = (file: File): boolean => {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
  return validTypes.includes(file.type)
}

const PDFUploader = ({ onExtractionComplete, onError, onLoading, onProgress }: PDFUploaderProps) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!isValidFileType(file)) {
      onError('Please upload a PDF, JPG, or PNG file')
      return
    }

    onLoading(true)
    onError(null)

    try {
      const extractedData = await extractPDFInfo(file, onProgress)
      onExtractionComplete(extractedData)
    } catch (error) {
      console.error('Error extracting file info:', error)
      onError(error instanceof Error ? error.message : 'Failed to extract information from file')
    } finally {
      onLoading(false)
    }
  }, [onExtractionComplete, onError, onLoading, onProgress])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1
  })

  return (
    <div className="uploader-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="upload-icon">📤</div>
          {isDragActive ? (
            <p className="dropzone-text">Drop the file here...</p>
          ) : (
            <>
              <p className="dropzone-text">
                Drag & drop a file here, or click to select
              </p>
              <p className="dropzone-hint">Supports PDF, JPG, and PNG files</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PDFUploader
