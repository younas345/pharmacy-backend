import pdf from 'pdf-parse';
import { client, deployment } from '../config/azureOpenAI';
import { AppError } from '../utils/appError';

export interface ReturnReportData {
  distributor?: string;
  pharmacy?: string;
  reportDate?: string;
  returnNumber?: string;
  items?: Array<{
    itemName?: string;
    itemCode?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    expiryDate?: string;
    reason?: string;
    batchNumber?: string;
  }>;
  totalAmount?: number;
  totalItems?: number;
  notes?: string;
  [key: string]: any;
}

export const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error: any) {
    throw new AppError(`Failed to extract text from PDF: ${error.message}`, 400);
  }
};

export const extractStructuredData = async (pdfText: string): Promise<ReturnReportData> => {
  try {
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '10000', 10);

    const systemPrompt = `You are an expert at extracting structured data from pharmacy return reports. 
Extract all relevant information from the return report and return it as a JSON object.

The return report typically contains:
- Distributor information (name, contact details)
- Pharmacy information (name, address, contact)
- Report date and return number
- List of returned items with details like:
  - Item name and code
  - Quantity returned
  - Unit price and total price
  - Expiry date
  - Reason for return (expired, damaged, etc.)
  - Batch number
- Total amount and total items
- Any additional notes or comments

Return the data as a JSON object with the following structure:
{
  "distributor": "distributor name",
  "pharmacy": "pharmacy name",
  "reportDate": "date in YYYY-MM-DD format",
  "returnNumber": "return/reference number",
  "items": [
    {
      "itemName": "item name",
      "itemCode": "item code/SKU",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "expiryDate": "YYYY-MM-DD",
      "reason": "reason for return",
      "batchNumber": "batch number if available"
    }
  ],
  "totalAmount": number,
  "totalItems": number,
  "notes": "any additional notes"
}

Extract all available information. If a field is not available, use null. Be thorough and accurate.`;

    const userPrompt = `Extract structured data from the following pharmacy return report:\n\n${pdfText}`;

    const response = await client.chat.completions.create({
      model: deployment as string,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.1, // Low temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AppError('No response from Azure OpenAI', 500);
    }

    // Try to extract JSON from the response
    let jsonData: ReturnReportData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonData = JSON.parse(cleanedContent);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON object from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new AppError('Failed to parse JSON from AI response', 500);
      }
    }

    return jsonData;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to extract structured data: ${error.message}`, 500);
  }
};

export const processReturnReport = async (pdfBuffer: Buffer): Promise<ReturnReportData> => {
  // Step 1: Extract text from PDF
  const pdfText = await extractTextFromPDF(pdfBuffer);

  if (!pdfText || pdfText.trim().length === 0) {
    throw new AppError('No text could be extracted from the PDF', 400);
  }

  // Step 2: Extract structured data using Azure OpenAI
  const structuredData = await extractStructuredData(pdfText);

  return structuredData;
};

