// Azure Document Intelligence Configuration
const ENDPOINT = import.meta.env.VITE_AZURE_DOCUMENT_ENDPOINT
const API_KEY = import.meta.env.VITE_AZURE_DOCUMENT_API_KEY
const API_VERSION = import.meta.env.VITE_AZURE_DOCUMENT_API_VERSION || '2023-10-31-preview'

// Validate required environment variables
if (!ENDPOINT) {
  throw new Error('VITE_AZURE_DOCUMENT_ENDPOINT environment variable is required. Please set it in .env.local')
}
if (!API_KEY) {
  throw new Error('VITE_AZURE_DOCUMENT_API_KEY environment variable is required. Please set it in .env.local')
}

export interface FormField {
  name: string
  value: string | boolean
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other'
  section?: string
  note?: string
  confidence?: number
}

export interface FormSection {
  title: string
  fields: FormField[]
}

export interface ExtractedPDFData {
  formFields: FormField[]
  sections: FormSection[]
  summary: string
  notes: string[]
  rawText?: string
}

export interface ProgressUpdate {
  step: number
  totalSteps: number
  message: string
  percent: number
}

export type ProgressCallback = (progress: ProgressUpdate) => void

/**
 * Check if file is an image (JPG, JPEG, PNG)
 */
function isImageFile(file: File): boolean {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png']
  return imageTypes.includes(file.type)
}

/**
 * Check if file is a PDF
 */
function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * Get the content type for the file
 */
function getContentType(file: File): string {
  if (isPdfFile(file)) return 'application/pdf'
  if (file.type === 'image/png') return 'image/png'
  return 'image/jpeg'
}

/**
 * Submit document to Azure Document Intelligence for analysis
 */
async function submitDocumentForAnalysis(file: File, onProgress?: ProgressCallback): Promise<string> {
  console.log('📤 Submitting document to Azure Document Intelligence...')
  
  onProgress?.({
    step: 1,
    totalSteps: 3,
    message: 'Uploading document for analysis...',
    percent: 10
  })

  const arrayBuffer = await file.arrayBuffer()
  const contentType = getContentType(file)
  
  // Use prebuilt-layout model for comprehensive document analysis
  const analyzeUrl = `${ENDPOINT}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${API_VERSION}`
  
  console.log('📡 API URL:', analyzeUrl)
  
  const response = await fetch(analyzeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Ocp-Apim-Subscription-Key': API_KEY,
    },
    body: arrayBuffer
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API Error:', response.status, errorText)
    throw new Error(`Azure Document Intelligence API error: ${response.status} - ${errorText}`)
  }

  // Get the operation location for polling
  const operationLocation = response.headers.get('Operation-Location')
  
  if (!operationLocation) {
    throw new Error('No operation location returned from Azure Document Intelligence')
  }
  
  console.log('✅ Document submitted successfully')
  console.log('📍 Operation Location:', operationLocation)
  
  return operationLocation
}

/**
 * Poll for analysis results
 */
async function pollForResults(operationLocation: string, onProgress?: ProgressCallback): Promise<any> {
  console.log('⏳ Polling for analysis results...')
  
  let attempts = 0
  const maxAttempts = 60 // Max 60 attempts (about 2 minutes)
  const pollInterval = 2000 // Poll every 2 seconds
  
  while (attempts < maxAttempts) {
    attempts++
    
    const progressPercent = Math.min(30 + Math.round((attempts / maxAttempts) * 50), 80)
    onProgress?.({
      step: 2,
      totalSteps: 3,
      message: `Analyzing document... (${attempts}s)`,
      percent: progressPercent
    })
    
    const response = await fetch(operationLocation, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY,
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get analysis results: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    console.log(`📊 Status: ${result.status} (attempt ${attempts})`)
    
    if (result.status === 'succeeded') {
      console.log('✅ Analysis completed successfully')
      return result.analyzeResult
    }
    
    if (result.status === 'failed') {
      console.error('❌ Analysis failed:', result.error)
      throw new Error(`Document analysis failed: ${result.error?.message || 'Unknown error'}`)
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }
  
  throw new Error('Analysis timed out after 2 minutes')
}

/**
 * Parse the analysis results into our format
 */
function parseAnalysisResults(analyzeResult: any): { sections: FormSection[], notes: string[], rawText: string } {
  console.log('📋 Parsing analysis results...')
  
  const sections: FormSection[] = []
  const notes: string[] = []
  let rawText = ''
  
  // Extract all text content
  if (analyzeResult.content) {
    rawText = analyzeResult.content
    console.log('📝 Total content length:', rawText.length)
  }
  
  // Process paragraphs
  if (analyzeResult.paragraphs) {
    console.log(`📄 Found ${analyzeResult.paragraphs.length} paragraphs`)
    
    // Try to identify sections from paragraphs
    let currentSectionTitle = 'Document Content'
    let currentFields: FormField[] = []
    
    analyzeResult.paragraphs.forEach((paragraph: any, index: number) => {
      const text = paragraph.content?.trim()
      if (!text) return
      
      // Check if this looks like a section header (short, possibly bold/different role)
      const isHeader = paragraph.role === 'sectionHeading' || 
                      paragraph.role === 'title' ||
                      (text.length < 100 && text.endsWith(':')) ||
                      (text.length < 50 && text === text.toUpperCase())
      
      if (isHeader && currentFields.length > 0) {
        // Save previous section
        sections.push({
          title: currentSectionTitle,
          fields: [...currentFields]
        })
        currentFields = []
        currentSectionTitle = text.replace(/:$/, '')
      } else if (isHeader) {
        currentSectionTitle = text.replace(/:$/, '')
      } else {
        // Check if text contains key-value pattern (e.g., "Name: John Doe")
        const kvMatch = text.match(/^([^:]+):\s*(.+)$/s)
        if (kvMatch) {
          currentFields.push({
            name: kvMatch[1].trim(),
            value: kvMatch[2].trim(),
            type: 'text',
            section: currentSectionTitle,
            confidence: paragraph.confidence
          })
        } else {
          // Add as a general text field
          currentFields.push({
            name: `Text ${index + 1}`,
            value: text,
            type: 'text',
            section: currentSectionTitle,
            confidence: paragraph.confidence
          })
        }
      }
    })
    
    // Don't forget the last section
    if (currentFields.length > 0) {
      sections.push({
        title: currentSectionTitle,
        fields: currentFields
      })
    }
  }
  
  // Process key-value pairs if available
  if (analyzeResult.keyValuePairs) {
    console.log(`🔑 Found ${analyzeResult.keyValuePairs.length} key-value pairs`)
    
    const kvFields: FormField[] = []
    
    analyzeResult.keyValuePairs.forEach((kv: any) => {
      const key = kv.key?.content?.trim()
      const value = kv.value?.content?.trim()
      
      if (key) {
        kvFields.push({
          name: key,
          value: value || '(empty)',
          type: 'text',
          section: 'Key-Value Pairs',
          confidence: kv.confidence
        })
      }
    })
    
    if (kvFields.length > 0) {
      sections.unshift({
        title: 'Form Fields',
        fields: kvFields
      })
    }
  }
  
  // Process tables
  if (analyzeResult.tables) {
    console.log(`📊 Found ${analyzeResult.tables.length} tables`)
    
    analyzeResult.tables.forEach((table: any, tableIndex: number) => {
      const tableFields: FormField[] = []
      
      // Get headers from first row
      const headers: string[] = []
      table.cells?.filter((cell: any) => cell.rowIndex === 0).forEach((cell: any) => {
        headers[cell.columnIndex] = cell.content?.trim() || `Column ${cell.columnIndex + 1}`
      })
      
      // Process data rows
      const dataRows: any[] = []
      table.cells?.filter((cell: any) => cell.rowIndex > 0).forEach((cell: any) => {
        if (!dataRows[cell.rowIndex]) {
          dataRows[cell.rowIndex] = {}
        }
        const header = headers[cell.columnIndex] || `Column ${cell.columnIndex + 1}`
        dataRows[cell.rowIndex][header] = cell.content?.trim()
      })
      
      // Convert to fields
      dataRows.forEach((row, rowIndex) => {
        if (row) {
          Object.entries(row).forEach(([header, value]) => {
            if (value) {
              tableFields.push({
                name: `${header} (Row ${rowIndex})`,
                value: value as string,
                type: 'text',
                section: `Table ${tableIndex + 1}`
              })
            }
          })
        }
      })
      
      if (tableFields.length > 0) {
        sections.push({
          title: `Table ${tableIndex + 1}`,
          fields: tableFields
        })
      }
    })
  }
  
  // Process selection marks (checkboxes)
  if (analyzeResult.pages) {
    const selectionFields: FormField[] = []
    
    analyzeResult.pages.forEach((page: any, pageIndex: number) => {
      if (page.selectionMarks) {
        console.log(`☑️ Found ${page.selectionMarks.length} selection marks on page ${pageIndex + 1}`)
        
        page.selectionMarks.forEach((mark: any, markIndex: number) => {
          selectionFields.push({
            name: `Selection ${markIndex + 1} (Page ${pageIndex + 1})`,
            value: mark.state === 'selected',
            type: 'checkbox',
            section: 'Checkboxes/Selections',
            confidence: mark.confidence,
            note: `State: ${mark.state}`
          })
        })
      }
    })
    
    if (selectionFields.length > 0) {
      sections.push({
        title: 'Checkboxes & Selections',
        fields: selectionFields
      })
    }
  }
  
  // Add notes about the analysis
  if (analyzeResult.pages) {
    notes.push(`Document has ${analyzeResult.pages.length} page(s)`)
  }
  
  if (analyzeResult.languages) {
    const langs = analyzeResult.languages.map((l: any) => l.locale).join(', ')
    notes.push(`Detected languages: ${langs}`)
  }
  
  console.log(`✅ Parsed ${sections.length} sections`)
  
  return { sections, notes, rawText }
}

/**
 * Generate a summary of the extracted data
 */
function generateSummary(sections: FormSection[]): string {
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0)
  const sectionNames = sections.map(s => s.title).join(', ')
  
  return `Extracted ${totalFields} fields across ${sections.length} sections: ${sectionNames}`
}

/**
 * Main function to extract form data from PDF or Image files using Azure Document Intelligence
 */
export async function extractPDFInfo(file: File, onProgress?: ProgressCallback): Promise<ExtractedPDFData> {
  try {
    console.log('========================================')
    console.log('=== AZURE DOCUMENT INTELLIGENCE START ===')
    console.log('========================================')
    console.log('📁 File name:', file.name)
    console.log('📊 File size:', (file.size / 1024).toFixed(2), 'KB')
    console.log('📄 File type:', file.type)
    console.log('')

    onProgress?.({
      step: 1,
      totalSteps: 3,
      message: 'Reading file...',
      percent: 5
    })

    // Validate file type
    if (!isPdfFile(file) && !isImageFile(file)) {
      throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF, JPG, or PNG file.`)
    }

    // Step 1: Submit document for analysis
    const operationLocation = await submitDocumentForAnalysis(file, onProgress)

    // Step 2: Poll for results
    onProgress?.({
      step: 2,
      totalSteps: 3,
      message: 'Analyzing document...',
      percent: 30
    })
    
    const analyzeResult = await pollForResults(operationLocation, onProgress)

    console.log('')
    console.log('========================================')
    console.log('=== AZURE DOCUMENT INTELLIGENCE END ===')
    console.log('========================================')

    // Step 3: Parse the results
    onProgress?.({
      step: 3,
      totalSteps: 3,
      message: 'Processing results...',
      percent: 90
    })

    const { sections, notes, rawText } = parseAnalysisResults(analyzeResult)
    
    // Flatten all fields for backward compatibility
    const formFields: FormField[] = sections.flatMap(section => section.fields)
    
    // Generate summary
    const summary = generateSummary(sections)

    console.log(`📋 Extracted ${sections.length} sections with ${formFields.length} total fields`)
    console.log('📝 Notes:', notes)
    
    onProgress?.({
      step: 3,
      totalSteps: 3,
      message: 'Extraction complete!',
      percent: 100
    })
    
    return {
      formFields,
      sections,
      summary,
      notes,
      rawText
    }
  } catch (error) {
    console.error('❌ Error in extractPDFInfo:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract document information: ${error.message}`)
    }
    throw new Error('Failed to extract document information: Unknown error')
  }
}

