import * as XLSX from 'xlsx'
import './ExtractedInfo.css'
import { ExtractedPDFData, FormField, FormSection } from '../services/azureDocumentIntelligence'

interface ExtractedInfoProps {
  data: ExtractedPDFData
}

const ExtractedInfo = ({ data }: ExtractedInfoProps) => {
  
  /**
   * Check if a field has a meaningful value (not empty, not unchecked)
   */
  const isFieldFilled = (field: FormField): boolean => {
    const { value, type } = field
    
    // For checkboxes and radio buttons, only show if selected/checked
    if (type === 'checkbox' || type === 'radio') {
      return value === true || value === 'true' || value === 'checked' || value === 'selected'
    }
    
    // For text fields, check if value is not empty
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase()
      // Filter out empty, placeholder, or meaningless values
      if (!trimmed || 
          trimmed === '' || 
          trimmed === '(empty)' || 
          trimmed === 'n/a' ||
          trimmed === 'na' ||
          trimmed === '-' ||
          trimmed === '--' ||
          trimmed === 'null' ||
          trimmed === 'undefined') {
        return false
      }
      return true
    }
    
    // For boolean values (other than checkbox/radio)
    if (typeof value === 'boolean') {
      return value === true
    }
    
    return false
  }

  /**
   * Filter sections to only include filled fields
   */
  const getFilteredSections = (): FormSection[] => {
    if (!data.sections || data.sections.length === 0) return []
    
    return data.sections
      .map(section => ({
        ...section,
        fields: section.fields.filter(isFieldFilled)
      }))
      .filter(section => section.fields.length > 0) // Only keep sections with filled fields
  }

  /**
   * Filter form fields to only include filled ones
   */
  const getFilteredFormFields = (): FormField[] => {
    if (!data.formFields || data.formFields.length === 0) return []
    return data.formFields.filter(isFieldFilled)
  }

  const getValueDisplay = (field: FormField) => {
    const { value, type, note } = field
    
    if (type === 'checkbox' || type === 'radio') {
      return (
        <span className="value-checked">
          ✓ Selected
          {note && <span className="field-note"> ({note})</span>}
        </span>
      )
    }
    
    return (
      <span className="value-text">
        {String(value)}
        {note && <span className="field-note"> ({note})</span>}
      </span>
    )
  }

  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase()
    if (lower.includes('patient')) return '👤'
    if (lower.includes('insurance') || lower.includes('payment')) return '💳'
    if (lower.includes('physician') || lower.includes('provider') || lower.includes('doctor')) return '🏥'
    if (lower.includes('specimen') || lower.includes('sample')) return '🧪'
    if (lower.includes('test') || lower.includes('service')) return '📋'
    if (lower.includes('signature')) return '✍️'
    if (lower.includes('checkbox') || lower.includes('selection')) return '☑️'
    if (lower.includes('form field') || lower.includes('key-value')) return '📝'
    if (lower.includes('table')) return '📊'
    return '📌'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checkbox': return '☑️'
      case 'radio': return '🔘'
      case 'dropdown': return '📋'
      case 'signature': return '✍️'
      default: return '📝'
    }
  }

  const downloadExcel = () => {
    const filteredSections = getFilteredSections()
    const filteredFields = getFilteredFormFields()
    
    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for Excel - only filled/selected items
    const excelData: any[] = []
    
    // Add summary row
    excelData.push({
      'Section': 'Summary',
      'Field Name': 'Document Summary',
      'Value': data.summary,
      'Type': 'text',
      'Notes': ''
    })
    
    // Add empty row for spacing
    excelData.push({})
    
    // Add all filled fields by section
    if (filteredSections.length > 0) {
      filteredSections.forEach((section) => {
        section.fields.forEach((field) => {
          excelData.push({
            'Section': section.title,
            'Field Name': field.name,
            'Value': typeof field.value === 'boolean' 
              ? 'Yes/Selected' 
              : String(field.value),
            'Type': field.type,
            'Notes': field.note || ''
          })
        })
      })
    } else if (filteredFields.length > 0) {
      filteredFields.forEach((field) => {
        excelData.push({
          'Section': field.section || 'General',
          'Field Name': field.name,
          'Value': typeof field.value === 'boolean' 
            ? 'Yes/Selected' 
            : String(field.value),
          'Type': field.type,
          'Notes': field.note || ''
        })
      })
    }
    
    // Add empty row before notes
    if (data.notes && data.notes.length > 0) {
      excelData.push({})
      excelData.push({
        'Section': 'Additional Notes',
        'Field Name': '',
        'Value': '',
        'Type': '',
        'Notes': ''
      })
      data.notes.forEach((note, index) => {
        excelData.push({
          'Section': '',
          'Field Name': `Note ${index + 1}`,
          'Value': note,
          'Type': 'note',
          'Notes': ''
        })
      })
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 },  // Section
      { wch: 30 },  // Field Name
      { wch: 40 },  // Value
      { wch: 12 },  // Type
      { wch: 30 }   // Notes
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Data')
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const filename = `extracted_data_${timestamp}.xlsx`
    
    // Download file
    XLSX.writeFile(workbook, filename)
  }

  // Get filtered data
  const filteredSections = getFilteredSections()
  const filteredFormFields = getFilteredFormFields()
  const totalFilledFields = filteredSections.reduce((sum, s) => sum + s.fields.length, 0) || filteredFormFields.length

  return (
    <div className="extracted-info">
      <div className="header-row">
        <h2 className="main-title">📄 Extracted Document Data</h2>
        <button className="download-btn" onClick={downloadExcel}>
          <span className="download-icon">📥</span>
          Download Excel
        </button>
      </div>

      {/* Summary Stats */}
      <div className="summary-section">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-number">{totalFilledFields}</span>
            <span className="stat-label">Filled Fields Found</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredSections.length}</span>
            <span className="stat-label">Sections</span>
          </div>
        </div>
        <p className="summary-text">{data.summary}</p>
      </div>

      {/* Sections with filled data only */}
      {filteredSections.length > 0 ? (
        <div className="sections-container">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="data-section">
              <h3 className="section-header">
                <span className="section-icon">{getSectionIcon(section.title)}</span>
                <span className="section-title">{section.title}</span>
                <span className="field-count">{section.fields.length} items</span>
              </h3>
              
              <div className="section-fields">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="field-row">
                    <span className="field-icon">{getTypeIcon(field.type)}</span>
                    <span className="field-label">{field.name}:</span>
                    <span className="field-value">{getValueDisplay(field)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredFormFields.length > 0 ? (
        /* Fallback to flat list if no sections */
        <div className="data-section">
          <h3 className="section-header">
            <span className="section-icon">📋</span>
            <span className="section-title">Filled Fields</span>
            <span className="field-count">{filteredFormFields.length} items</span>
          </h3>
          <div className="section-fields">
            {filteredFormFields.map((field, index) => (
              <div key={index} className="field-row">
                <span className="field-icon">{getTypeIcon(field.type)}</span>
                <span className="field-label">{field.name}:</span>
                <span className="field-value">{getValueDisplay(field)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-data">
          <div className="no-data-icon">📭</div>
          <p className="no-data-title">No Filled Data Found</p>
          <p className="no-data-text">The document doesn't appear to have any filled fields or selected options.</p>
        </div>
      )}

      {/* Notes */}
      {data.notes && data.notes.length > 0 && (
        <div className="data-section notes-section">
          <h3 className="section-header">
            <span className="section-icon">📝</span>
            <span className="section-title">Additional Notes</span>
          </h3>
          <div className="notes-list">
            {data.notes.map((note, index) => (
              <div key={index} className="note-item">
                <span className="note-bullet">•</span>
                <span className="note-text">{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtractedInfo
