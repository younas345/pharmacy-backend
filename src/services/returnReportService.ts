import pdf from 'pdf-parse';
import { client, deployment } from '../config/azureOpenAI';
import { AppError } from '../utils/appError';
import { supabaseAdmin } from '../config/supabase';

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
      "pricePerUnit": number,
      "pharmacy": "pharmacy name if available",
      "reportDate": "YYYY-MM-DD",
      "creditReportNumber": "reference number",
      "reverseDistributor": "reverse distributor name if available"
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

// Generate fake distributor names
const generateFakeDistributorName = (): string => {
  const distributors = [
    'MedReturn Solutions Inc.',
    'PharmaCredit Distributors',
    'RxReturn Services LLC',
    'Healthcare Returns Group',
    'Pharmacy Credit Solutions',
    'MedSupply Returns Co.',
    'RxCredit Distributors',
    'PharmaReturn Network',
    'Healthcare Credit Services',
    'MedReturn Partners',
  ];
  return distributors[Math.floor(Math.random() * distributors.length)];
};

// Generate fake price per unit (realistic range for pharmacy returns: $0.10 to $50.00)
const generateFakePricePerUnit = (): number => {
  // Generate price between $0.10 and $50.00 with 2 decimal places
  const min = 0.10;
  const max = 50.00;
  const price = Math.random() * (max - min) + min;
  return Math.round(price * 100) / 100;
};

// Replace real prices and distributor name with fake ones
const fakePricesAndDistributor = (data: ReturnReportData): ReturnReportData => {
  // Generate a fake distributor name
  const fakeDistributorName = generateFakeDistributorName();
  
  // Replace distributor name
  data.reverseDistributor = fakeDistributorName;
  
  // Replace prices for each item
  let totalCreditAmount = 0;
  
  if (data.items && data.items.length > 0) {
    data.items = data.items.map((item) => {
      // Generate fake price per unit
      const fakePricePerUnit = generateFakePricePerUnit();
      
      // Calculate fake credit amount based on quantity
      const quantity = item.quantity || 1;
      const fakeCreditAmount = Math.round(fakePricePerUnit * quantity * 100) / 100;
      
      // Update item with fake prices
      const fakeItem = {
        ...item,
        pricePerUnit: fakePricePerUnit,
        creditAmount: fakeCreditAmount,
        reverseDistributor: fakeDistributorName, // Also update in item if present
      };
      
      totalCreditAmount += fakeCreditAmount;
      
      return fakeItem;
    });
    
    // Update total credit amount
    data.totalCreditAmount = Math.round(totalCreditAmount * 100) / 100;
  }
  
  return data;
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

  // Step 3: Toggle between fake and real data
  // Set USE_FAKE_DATA=true in .env to enable fake prices and distributor names
  // Set USE_FAKE_DATA=false or omit it to use real extracted data
  const useFakeData = process.env.USE_FAKE_DATA === 'true' || process.env.USE_FAKE_DATA === '1';
  
  if (useFakeData) {
    // Replace real prices and distributor name with fake ones
    const fakedData = fakePricesAndDistributor(structuredData);
    console.log('🔧 Faked prices and distributor name for processed report');
    return fakedData;
  } else {
    console.log('✅ Using real extracted data (no faking)');
    return structuredData;
  }
};

export interface SaveReturnReportInput {
  document_id: string;
  pharmacy_id: string;
  data: ReturnReportData;
}

export interface ReturnReportRecord {
  id: string;
  document_id: string;
  pharmacy_id: string;
  data: any; // Single item object stored as JSONB
  created_at: string;
  updated_at: string;
}

export const saveReturnReport = async (
  input: SaveReturnReportInput
): Promise<ReturnReportRecord[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Extract items array from the data
  const items = input.data.items || [];
  
  if (items.length === 0) {
    throw new AppError('No items to save in return report', 400);
  }

  // Create one record per item
  const recordsToInsert = items.map((item: any) => ({
    document_id: input.document_id,
    pharmacy_id: input.pharmacy_id,
    data: item, // Store each item object as JSONB
  }));

  // Insert all records at once
  const { data, error } = await db
    .from('return_reports')
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw new AppError(`Failed to save return report items: ${error.message}`, 400);
  }

  return data || [];
};

