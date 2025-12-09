import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// Azure OpenAI Configuration - loaded from .env file
const API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY
const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || import.meta.env.VITE_OPENAI_MODEL
const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-01-01-preview'

// Validate configuration
if (!API_KEY || !ENDPOINT || !DEPLOYMENT) {
  console.error('❌ Missing Azure OpenAI configuration. Please check your .env file.')
  console.error('Required variables: VITE_AZURE_OPENAI_API_KEY, VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_DEPLOYMENT')
}


export interface FormField {
  name: string
  value: string | boolean
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other'
  section?: string
  note?: string
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
 * Convert PDF file to array of base64 images (one per page)
 */
async function convertPdfToImages(file: File, onProgress?: ProgressCallback): Promise<string[]> {
  console.log('📄 Converting PDF to images...')
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  const images: string[] = []
  const scale = 2.0 // Higher scale for better quality
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    console.log(`  📃 Processing page ${pageNum}/${pdf.numPages}...`)
    
    onProgress?.({
      step: 1,
      totalSteps: 3,
      message: `Converting page ${pageNum} of ${pdf.numPages}...`,
      percent: Math.round((pageNum / pdf.numPages) * 30) // 0-30%
    })
    
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    
    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise
    
    // Convert to base64 (JPEG for smaller size)
    const base64 = canvas.toDataURL('image/jpeg', 0.9)
    images.push(base64)
    
    console.log(`  ✅ Page ${pageNum} converted (${Math.round(base64.length / 1024)}KB)`)
  }
  
  console.log(`✅ PDF converted to ${images.length} images`)
  return images
}

/**
 * Convert image file (JPG/PNG) to base64
 */
async function convertImageToBase64(file: File, onProgress?: ProgressCallback): Promise<string[]> {
  console.log('🖼️ Converting image to base64...')
  
  onProgress?.({
    step: 1,
    totalSteps: 3,
    message: 'Processing image...',
    percent: 15
  })
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const base64 = reader.result as string
      console.log(`✅ Image converted (${Math.round(base64.length / 1024)}KB)`)
      onProgress?.({
        step: 1,
        totalSteps: 3,
        message: 'Image processed successfully',
        percent: 30
      })
      resolve([base64])
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    
    reader.readAsDataURL(file)
  })
}

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
 * Send images to Azure OpenAI with vision capability to analyze PDF
 */
async function analyzeImagesWithVision(images: string[], onProgress?: ProgressCallback): Promise<string> {
  console.log('🤖 Sending images to Azure OpenAI for analysis...')
  
  onProgress?.({
    step: 2,
    totalSteps: 3,
    message: 'Uploading to AI for analysis...',
    percent: 40
  })
  
  // Build content array with all page images
  const imageContent = images.map((base64) => ({
    type: 'image_url' as const,
    image_url: {
      url: base64,
      detail: 'high' as const
    }
  }))
  
  const prompt = `You are an expert document analyzer. Analyze this PDF form image(s) and extract ALL data that has been filled in.

🔍 YOUR TASK:
Carefully examine every part of the form and extract ALL filled/selected information. Be thorough and detailed.

📋 WHAT TO LOOK FOR:

1. **TEXT FIELDS** - Any handwritten or typed text in form fields:
   - Names (first name, last name, full name)
   - Addresses (street, city, state, zip)
   - Phone numbers
   - Email addresses
   - Dates (date of birth, collection date, etc.)
   - ID numbers (NPI, group numbers, policy numbers)
   - Any other filled text

2. **NUMBERS** - Pay EXTRA attention to all numeric values:
   - Phone numbers (extract EXACTLY as written, digit by digit)
   - Dates (extract EXACTLY as written - DD/MM/YYYY or MM/DD/YYYY format)
   - ID numbers, NPI numbers, Group numbers (extract EVERY digit precisely)
   - Policy numbers, Member IDs
   - Zip codes, Street numbers
   - ICD-10 codes (e.g., 299.81)
   - Any numeric codes or reference numbers
   ⚠️ DO NOT GUESS OR ASSUME ANY DIGITS - read each number character by character

3. **CHECKBOXES** - ONLY mark as CHECKED if you see ACTUAL marks inside the box:
   - ✓ checkmarks (tick marks)
   - X marks (cross marks)
   - Filled/shaded boxes (box is colored in)
   - A clear dot or circle inside the box
   ⛔ DO NOT mark as checked if: box is empty, text is just bold, text is highlighted, or box is just outlined
   ✅ ONLY mark as CHECKED if there is a VISIBLE MARK inside the checkbox

4. **RADIO BUTTONS** - ONLY mark as SELECTED if the circle has a visible indicator:
   - Filled/shaded circle (circle is colored in)
   - Dot inside the circle
   - Circle is clearly marked differently from empty circles
   ⛔ DO NOT mark as selected if: circle is empty, text is just bold, or text is highlighted
   ✅ ONLY mark as SELECTED if there is a VISIBLE MARK inside or filling the circle

5. **SELECTED OPTIONS** - ONLY mark as selected if there is a clear visual indicator:
   - Test selections - look for actual marks next to them
   - Service types - look for actual marks next to them
   - Specimen types - look for actual marks next to them
   ⛔ Bold text, underlined text, or highlighted text does NOT mean selected

6. **SIGNATURES** - Any signed fields

📊 ORGANIZE BY SECTIONS (if applicable):
- Patient Information
- Insurance/Payment Information  
- Physician/Provider Information
- Specimen/Sample Information
- Test/Service Selections
- Other Information

✍️ HANDWRITTEN TEXT - TAKE YOUR TIME:
- If text is handwritten, slow down and analyze each character carefully
- Look at the shape of each letter - don't rush
- Compare unclear letters to other letters in the same handwriting
- Consider the context (e.g., if it's a name field, it should be a name)
- If a letter could be multiple things (like 'a' vs 'o'), look at how the person writes similar letters elsewhere
- For cursive or connected writing, trace the strokes carefully
- ONLY extract what you can confidently read
- If truly unreadable, mark as "(illegible)" rather than guessing
- if something is not clear, and different numbers maybe written in different styles, Then pay attention on like what it can be, and then write it down.

⚠️ CRITICAL RULES FOR ACCURACY:
- **TAKE YOUR TIME** - There is no rush, accuracy is more important than speed
- Extract the EXACT text as written (even if misspelled or unclear)
- **NUMBERS MUST BE EXACT** - Do NOT guess, assume, or round any numbers
- Read phone numbers digit by digit: e.g., 521-556-9134 not 521-556-9xxx
- Read dates exactly: e.g., 1-11-1982 not 01-11-1982 unless that's what's written
- Read ID numbers precisely: every digit matters
- If a character is hard to read, analyze it multiple times before deciding
- If still uncertain after careful analysis, mark unclear parts with "?" or "(unclear)"
- Example: If phone looks like 521-5?6-9134, write it that way
- Include ALL filled fields, don't skip anything
- Mention if some tests appear to be selected but unclear
- **NEVER GUESS** - if you cannot read something clearly, say so instead of making up text

🚨 **MOST CRITICAL RULE - CHECKBOX/SELECTION DETECTION**:
- **ONLY mark checkboxes as CHECKED if you see**: ✓ checkmarks, X marks, filled boxes, or dots INSIDE the checkbox
- **ONLY mark radio buttons as SELECTED if you see**: filled circles, dots inside circles, or shaded circles
- **BOLD TEXT ≠ SELECTED** - Bold formatting does NOT mean something is checked/selected
- **HIGHLIGHTED TEXT ≠ SELECTED** - Highlighted text does NOT mean something is checked/selected  
- **UNDERLINED TEXT ≠ SELECTED** - Underlined text does NOT mean something is checked/selected
- **EMPTY BOX = NOT CHECKED** - If the checkbox box is empty with no mark inside, it is NOT checked
- **EMPTY CIRCLE = NOT SELECTED** - If the radio button circle is empty, it is NOT selected
- Look INSIDE the checkbox/circle for actual marks, not at the text formatting
- If unsure whether something is checked, mark it as "(unclear if selected)" rather than guessing

Return a valid JSON object:
{
  "summary": "Description of the form type (e.g., 'Clinical Laboratory Order Form from STX Clinical Labs')",
  "sections": [
    {
      "title": "Section Name (e.g., Patient Information)",
      "fields": [
        {
          "name": "Field Label",
          "value": "Extracted Value",
          "type": "text|checkbox|radio|dropdown",
          "note": "Optional note if unclear or partially visible"
        }
      ]
    }
  ],
  "notes": [
    "Any additional observations about the form",
    "Notes about unclear or distorted text",
    "Notes about tests that may or may not be selected"
  ]
}



Analyze all ${images.length} page(s) thoroughly. Extract EVERYTHING you can see that has been filled in.`

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...imageContent
      ]
    }
  ]

  const apiUrl = `${ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`
  
  console.log('📡 API URL:', apiUrl)
  console.log('📤 Sending request with', images.length, 'images...')

  onProgress?.({
    step: 2,
    totalSteps: 3,
    message: 'Analyzing the document...',
    percent: 50
  })

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 4096,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API Error:', response.status, errorText)
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  console.log('✅ AI Response received')
  console.log('📝 Raw AI Response:', content)
  
  onProgress?.({
    step: 2,
    totalSteps: 3,
    message: 'AI analysis complete',
    percent: 80
  })
  
  return content
}

/**
 * Main function to extract form data from PDF or Image files
 */
export async function extractPDFInfo(file: File, onProgress?: ProgressCallback): Promise<ExtractedPDFData> {
  try {
    console.log('========================================')
    console.log('=== FORM DATA EXTRACTION START ===')
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

    // Step 1: Convert file to images based on type
    let images: string[] = []
    
    if (isPdfFile(file)) {
      console.log('📄 Detected PDF file')
      images = await convertPdfToImages(file, onProgress)
    } else if (isImageFile(file)) {
      console.log('🖼️ Detected image file (JPG/PNG)')
      images = await convertImageToBase64(file, onProgress)
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF, JPG, or PNG file.`)
    }
    
    if (images.length === 0) {
      throw new Error('No content found in file')
    }

    // Step 2: Send images to Azure OpenAI Vision for analysis
    const aiResponse = await analyzeImagesWithVision(images, onProgress)

    console.log('')
    console.log('========================================')
    console.log('=== FORM DATA EXTRACTION END ===')
    console.log('========================================')

    // Step 3: Parse the JSON response
    onProgress?.({
      step: 3,
      totalSteps: 3,
      message: 'Processing results...',
      percent: 90
    })
    
    let parsedResponse: any = null
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       aiResponse.match(/(\{[\s\S]*\})/s)
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse
      parsedResponse = JSON.parse(jsonString)
      console.log('✅ Successfully parsed JSON response')
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON, using text as summary')
      parsedResponse = {
        summary: aiResponse,
        sections: [],
        notes: []
      }
    }

    // Extract sections
    const sections: FormSection[] = (parsedResponse.sections || []).map((section: any) => ({
      title: section.title || 'Other',
      fields: (section.fields || []).map((field: any) => ({
        name: String(field.name || '').trim(),
        value: field.type === 'checkbox' ? Boolean(field.value === true || field.value === 'true' || field.value === 'checked') : String(field.value || ''),
        type: field.type || 'text',
        section: section.title,
        note: field.note || undefined
      }))
    }))

    // Flatten all fields for backward compatibility
    const formFields: FormField[] = sections.flatMap(section => section.fields)

    // Extract notes
    const notes: string[] = parsedResponse.notes || []

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
      summary: parsedResponse.summary || 'Form data extracted',
      notes,
      rawText: aiResponse
    }
  } catch (error) {
    console.error('❌ Error in extractPDFInfo:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to extract PDF information: ${error.message}`)
    }
    throw new Error('Failed to extract PDF information: Unknown error')
  }
}
