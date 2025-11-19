import pdf from 'pdf-parse';
import { client, deployment } from '../config/azureOpenAI';
import { AppError } from '../utils/appError';

export interface ReturnReportData {
  reverseDistributor?: string; // Name of the reverse distributor company
  pharmacy?: string; // Pharmacy name (if available)
  reportDate?: string; // Date of the credit report (YYYY-MM-DD format)
  creditReportNumber?: string; // Report/credit number/reference number
  items?: Array<{
    ndcCode?: string; // NDC code (National Drug Code) - CRITICAL for price comparison
    itemName?: string; // Product/item name
    manufacturer?: string; // Manufacturer information
    lotNumber?: string; // Lot/batch number
    expirationDate?: string; // Expiration date (YYYY-MM-DD format)
    quantity?: number; // Quantity returned
    creditAmount?: number; // Credit amount/payment for this product
    pricePerUnit?: number; // Calculated: creditAmount / quantity
  }>;
  totalCreditAmount?: number; // Total credit amount for the entire report
  totalItems?: number; // Total number of items in the report
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
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '20000', 10);

    const systemPrompt = `You are an expert at extracting structured data from pharmacy credit reports (return reports) from reverse distributors. 
Your task is to extract ONLY the critical information needed for price comparison analytics.

CRITICAL FIELDS TO EXTRACT:
1. Reverse Distributor Name - The company name that issued this credit report
2. NDC Codes - National Drug Code for each product (format: XXXXX-XXXX-XX or XXXXXXXX-XX or similar)
3. Lot Numbers - Batch/lot numbers for each product
4. Expiration Dates - Expiration dates for each product
5. Quantity - Number of units returned for each product
6. Credit Amount - Payment/credit amount for each product
7. Price Per Unit - Calculate this as: creditAmount / quantity
8. Manufacturer - Manufacturer name for each product
9. Report Date - Date of the credit report
10. Credit Report Number - Reference/credit number

IMPORTANT INSTRUCTIONS:
- Focus ONLY on extracting the fields listed above
- NDC codes are CRITICAL - extract them accurately in any format they appear
- Calculate pricePerUnit = creditAmount / quantity for each item
- Extract dates in YYYY-MM-DD format
- If a field is not available in the PDF, use null
- Do NOT extract unnecessary information like addresses, phone numbers, or other non-essential data
- Return data as a clean JSON object

Return the data in this exact JSON structure:
{
  "reverseDistributor": "company name",
  "pharmacy": "pharmacy name if available",
  "reportDate": "YYYY-MM-DD",
  "creditReportNumber": "reference number",
  "items": [
    {
      "ndcCode": "NDC code",
      "itemName": "product name",
      "manufacturer": "manufacturer name",
      "lotNumber": "lot/batch number",
      "expirationDate": "YYYY-MM-DD",
      "quantity": number,
      "creditAmount": number,
      "pricePerUnit": number
    }
  ],
  "totalCreditAmount": number,
  "totalItems": number
}

Extract all available information accurately. Be thorough with NDC codes and pricing data.`;

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
  console.log('pdfText', pdfText);
  if (!pdfText || pdfText.trim().length === 0) {
    throw new AppError('No text could be extracted from the PDF', 400);
  }

  // Step 2: Extract structured data using Azure OpenAI
  const structuredData = await extractStructuredData(pdfText);

  return structuredData;
};

