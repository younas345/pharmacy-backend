import { client, deployment } from '../config/azureOpenAI';
import { AppError } from '../utils/appError';

export interface ParsedBarcodeData {
  ndc: string;
  lotNumber?: string;
  expirationDate?: string;
}

/**
 * Parse barcode data using Azure OpenAI to extract NDC, lot number, and expiration date
 */
export const parseBarcodeWithAI = async (barcodeData: string): Promise<ParsedBarcodeData> => {
  try {
    const systemPrompt = `You are an expert at parsing pharmaceutical barcode data. Your task is to extract exactly 3 pieces of information from barcode data:

1. NDC Code (National Drug Code) - Format: XXXXX-XXXX-XX or XXXXXXXX-XX or similar
2. Lot Number - Batch/lot number (alphanumeric, may include letters and numbers)
3. Expiration Date - Date in YYYY-MM-DD format

The barcode data may be in various formats:
- Pipe-delimited: "NDC|LOT|EXP"
- Colon-delimited: "NDC:LOT:EXP"
- Space-separated: "NDC LOT EXP"
- Combined string: "NDCLOTEXP" or similar
- Just NDC code alone
- GS1 format or other structured formats

IMPORTANT INSTRUCTIONS:
- Extract the NDC code accurately (it's usually 10-11 digits, may have dashes)
- Extract lot number if present (can be alphanumeric)
- Extract expiration date if present (convert to YYYY-MM-DD format)
- If a field is not found in the barcode, return null for that field
- NDC is REQUIRED - if you can't find it, try to extract any numeric code that looks like an NDC
- Return ONLY valid JSON, no additional text or explanation

Return the data in this exact JSON structure:
{
  "ndc": "NDC code in standard format (XXXXX-XXXX-XX)",
  "lotNumber": "lot number or null",
  "expirationDate": "YYYY-MM-DD or null"
}`;

    const userPrompt = `Parse the following barcode data and extract NDC code, lot number, and expiration date:

Barcode Data: "${barcodeData}"

Return only the JSON object with the three fields.`;

    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10);

    const response = await client.chat.completions.create({
      model: deployment as string,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.1, // Low temperature for more consistent parsing
      response_format: { type: 'json_object' } as any, // Force JSON response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppError('No response from AI service', 500);
    }

    // Parse the JSON response
    let parsedData: ParsedBarcodeData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing AI response:', content);
      throw new AppError('Invalid response format from AI service', 500);
    }

    // Validate that NDC is present
    if (!parsedData.ndc || parsedData.ndc.trim() === '') {
      // Try to extract NDC from the original barcode data as fallback
      const ndcMatch = barcodeData.match(/(\d{5,11}[-]?\d{3,4}[-]?\d{1,2})/);
      if (ndcMatch) {
        parsedData.ndc = normalizeNDC(ndcMatch[1]);
      } else {
        throw new AppError('Could not extract NDC code from barcode', 400);
      }
    } else {
      // Normalize NDC format
      parsedData.ndc = normalizeNDC(parsedData.ndc);
    }

    // Normalize expiration date format if present
    if (parsedData.expirationDate) {
      parsedData.expirationDate = normalizeDate(parsedData.expirationDate);
    }

    return parsedData;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error parsing barcode with AI:', error);
    throw new AppError(
      `Failed to parse barcode: ${error.message || 'Unknown error'}`,
      500
    );
  }
};

/**
 * Normalize NDC format to standard XXXXX-XXXX-XX format
 */
function normalizeNDC(ndc: string): string {
  if (!ndc) return '';
  
  // Remove all non-digits
  const digits = ndc.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 11) {
    // Format: XXXXX-XXXX-XX
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 11)}`;
  } else if (digits.length === 10) {
    // Format: XXXXX-XXXX-X
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 10)}`;
  } else if (digits.length === 9) {
    // Format: XXXX-XXXX-X
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 9)}`;
  }
  
  // Return as-is if doesn't match standard formats
  return ndc;
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDate(date: string): string {
  if (!date) return '';
  
  // Try to parse various date formats
  const dateMatch = date.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }
  
  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = date.match(/(\d{1,2})[/](\d{1,2})[/](\d{4})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    // Assume MM/DD/YYYY format
    return `${year}-${month}-${day}`;
  }
  
  return date;
}

