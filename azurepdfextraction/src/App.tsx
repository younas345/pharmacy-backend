import { useState } from 'react'
import PDFUploader from './components/PDFUploader'
import ExtractedInfo from './components/ExtractedInfo'
import { ExtractedPDFData, ProgressUpdate } from './services/azureDocumentIntelligence'
import './App.css'

function App() {
  const [extractedData, setExtractedData] = useState<ExtractedPDFData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)

  const handleExtractionComplete = (data: ExtractedPDFData) => {
    setExtractedData(data)
    setError(null)
    setProgress(null)
  }

  const handleError = (errorMessage: string | null) => {
    setError(errorMessage)
    if (errorMessage) {
      setExtractedData(null)
    }
    setProgress(null)
  }

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading)
    if (!loading) {
      setProgress(null)
    }
  }

  const handleProgress = (progressUpdate: ProgressUpdate) => {
    setProgress(progressUpdate)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🔍 Document Data Extractor</h1>
          <p>Upload a document and extract filled field values</p>
        </header>

        <PDFUploader
          onExtractionComplete={handleExtractionComplete}
          onError={handleError}
          onLoading={handleLoading}
          onProgress={handleProgress}
        />

        {isLoading && (
          <div className="loading-container">
            <div className="progress-wrapper">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <div className="progress-info">
                <span className="progress-percent">{progress?.percent || 0}%</span>
                <span className="progress-step">Step {progress?.step || 1} of {progress?.totalSteps || 3}</span>
              </div>
            </div>
            <p className="progress-message">{progress?.message || 'Starting...'}</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>❌ {error}</p>
          </div>
        )}

        {extractedData && !isLoading && (
          <ExtractedInfo data={extractedData} />
        )}
      </div>
    </div>
  )
}

export default App
