import pdf from 'pdf-parse';
import { client, deployment } from '../config/azureOpenAI';
import { AppError } from '../utils/appError';
import { supabaseAdmin } from '../config/supabase';

export interface ReverseDistributorInfo {
  name?: string; // Name of the reverse distributor company
  contactEmail?: string; // Contact email address
  contactPhone?: string; // Contact phone number
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    [key: string]: any;
  };
  portalUrl?: string; // Portal/website URL
  supportedFormats?: string[]; // Supported file formats (e.g., ["PDF", "CSV"])
}

export interface ReturnReportData {
  reverseDistributor?: string; // Name of the reverse distributor company (for backward compatibility)
  reverseDistributorInfo?: ReverseDistributorInfo; // Detailed distributor information
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
Your PRIMARY task is to extract comprehensive distributor information AND product/item details from the PDF text.

═══════════════════════════════════════════════════════════════
DISTRIBUTOR INFORMATION - EXTRACT EVERYTHING YOU CAN FIND:
═══════════════════════════════════════════════════════════════

1. DISTRIBUTOR NAME (REQUIRED):
   - Look for company name in headers, footers, letterhead, or "From:" sections
   - Common locations: Top of page, return address, company letterhead
   - Examples: "ABC Pharmaceutical Returns", "XYZ Distributors Inc.", "MedReturn Solutions"

2. CONTACT EMAIL:
   - Search for email patterns: text@domain.com
   - Look in headers, footers, contact sections, or signature blocks
   - Common labels: "Email:", "E-mail:", "Contact:", "support@", "info@", "sales@"

3. CONTACT PHONE:
   - Search for phone number patterns: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXX.XXX.XXXX
   - Look in headers, footers, contact sections
   - Common labels: "Phone:", "Tel:", "Call:", "Contact:", "Phone Number:"

4. ADDRESS (Extract all components):
   - Look for complete mailing addresses in headers, footers, or contact sections
   - Extract separately:
     * street: Street address and number (e.g., "123 Main Street", "456 Oak Ave")
     * city: City name
     * state: State abbreviation or full name (e.g., "CA", "California")
     * zipCode: ZIP/Postal code (e.g., "12345", "90210-1234")
     * country: Country name (e.g., "USA", "United States")

5. PORTAL/WEBSITE URL:
   - Look for URLs: http://, https://, www.
   - Common locations: Headers, footers, contact sections, "Visit us at:", "Portal:"
   - Examples: "https://portal.example.com", "www.distributor.com/returns"

6. SUPPORTED FORMATS:
   - Look for mentions of file formats: "PDF", "CSV", "Excel", "XML", "EDI"
   - Common phrases: "Accepts:", "Formats:", "File types:", "We accept"

═══════════════════════════════════════════════════════════════
PRODUCT/ITEM INFORMATION - EXTRACT FOR EACH ITEM:
═══════════════════════════════════════════════════════════════

1. NDC CODE (CRITICAL - REQUIRED):
   - National Drug Code in formats: XXXXX-XXXX-XX, XXXXXXXX-XX, XXXXX-XXXXX-XX
   - Look in product tables, item listings, or product columns
   - MUST extract accurately - this is critical for matching

2. ITEM NAME:
   - Product name/description from the item listing

3. MANUFACTURER:
   - Manufacturer name for the product

4. LOT NUMBER:
   - Batch/lot number (may be labeled as "Lot", "Batch", "Lot #", "Batch #")

5. EXPIRATION DATE:
   - Expiration date in any format, convert to YYYY-MM-DD
   - Look for "Exp", "Expiry", "Exp Date", "Expiration"

6. QUANTITY:
   - Number of units returned (numeric value)

7. CREDIT AMOUNT:
   - Payment/credit amount for this item (numeric, may have $ sign)

8. PRICE PER UNIT:
   - Calculate: creditAmount / quantity
   - If already provided, use that value

═══════════════════════════════════════════════════════════════
REPORT INFORMATION:
═══════════════════════════════════════════════════════════════

1. REPORT DATE:
   - Date of the credit report (convert to YYYY-MM-DD format)
   - Look for "Date:", "Report Date:", "Credit Date:", "As of:"

2. CREDIT REPORT NUMBER:
   - Reference number, credit number, report number
   - Look for "Credit #", "Report #", "Reference #", "Credit Number:"

3. PHARMACY NAME:
   - Pharmacy name if mentioned (may be in "To:", "Pharmacy:", or header)

4. TOTAL CREDIT AMOUNT:
   - Total amount for entire report (usually at bottom of report)

5. TOTAL ITEMS:
   - Total number of items in the report

═══════════════════════════════════════════════════════════════
CRITICAL EXTRACTION RULES:
═══════════════════════════════════════════════════════════════

1. DISTRIBUTOR INFO IS PRIORITY: Search the ENTIRE PDF text for distributor information
   - Check headers, footers, letterhead, contact sections, signature blocks
   - Look for company information sections
   - Extract EVERY piece of distributor contact information you find

2. BE THOROUGH: Read through ALL text, not just tables
   - Distributor info is often in headers/footers that might be missed
   - Contact information may be in small print or sidebars

3. FORMAT HANDLING:
   - Phone numbers: Normalize to format like "123-456-7890" or "(123) 456-7890"
   - Dates: Always convert to YYYY-MM-DD format
   - Address: Break into components (street, city, state, zipCode, country)

4. NULL HANDLING:
   - If a field is not found, use null (for optional fields) or omit it
   - DO NOT make up information - only extract what's actually in the PDF

5. JSON STRUCTURE: Return data in this EXACT structure:

{
  "reverseDistributor": "Full Company Name Here",
  "reverseDistributorInfo": {
    "name": "Full Company Name Here",
    "contactEmail": "email@example.com" or null,
    "contactPhone": "123-456-7890" or null,
    "address": {
      "street": "123 Main Street" or null,
      "city": "City Name" or null,
      "state": "CA" or null,
      "zipCode": "12345" or null,
      "country": "USA" or null
    } or null,
    "portalUrl": "https://portal.example.com" or null,
    "supportedFormats": ["PDF", "CSV"] or null
  },
  "pharmacy": "Pharmacy Name" or null,
  "reportDate": "YYYY-MM-DD",
  "creditReportNumber": "REF-12345" or null,
  "items": [
    {
      "ndcCode": "12345-678-90",
      "itemName": "Product Name",
      "manufacturer": "Manufacturer Name" or null,
      "lotNumber": "LOT123" or null,
      "expirationDate": "YYYY-MM-DD" or null,
      "quantity": 10,
      "creditAmount": 125.50,
      "pricePerUnit": 12.55
    }
  ],
  "totalCreditAmount": 125.50,
  "totalItems": 1
}

REMEMBER: Extract ALL distributor information you can find in the PDF. Be thorough and search the entire document text, not just the main content area.`;

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

    // Log extracted distributor information for debugging
    if (jsonData.reverseDistributorInfo) {
      console.log('📋 Extracted Distributor Info:');
      console.log('   Name:', jsonData.reverseDistributorInfo.name);
      console.log('   Email:', jsonData.reverseDistributorInfo.contactEmail || 'Not found');
      console.log('   Phone:', jsonData.reverseDistributorInfo.contactPhone || 'Not found');
      console.log('   Address:', jsonData.reverseDistributorInfo.address || 'Not found');
      console.log('   Portal URL:', jsonData.reverseDistributorInfo.portalUrl || 'Not found');
      console.log('   Supported Formats:', jsonData.reverseDistributorInfo.supportedFormats || 'Not found');
    } else if (jsonData.reverseDistributor) {
      console.log('📋 Extracted Distributor Name only:', jsonData.reverseDistributor);
      console.log('⚠️ No detailed distributor info extracted');
    } else {
      console.log('⚠️ No distributor information extracted from PDF');
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

// Generate fake email address
const generateFakeEmail = (companyName: string): string => {
  const domains = ['returns.com', 'pharma.com', 'distributors.com', 'services.com', 'solutions.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  const prefixes = ['info', 'support', 'contact', 'sales', 'returns'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}@${companySlug}${domain}`;
};

// Generate fake phone number
const generateFakePhone = (): string => {
  const areaCode = Math.floor(Math.random() * 800) + 200; // 200-999
  const exchange = Math.floor(Math.random() * 800) + 200; // 200-999
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${areaCode}-${exchange}-${number}`;
};

// Generate fake address
const generateFakeAddress = (): { street: string; city: string; state: string; zipCode: string; country: string } => {
  const streets = [
    '123 Commerce Drive',
    '456 Business Park Blvd',
    '789 Industrial Way',
    '321 Distribution Center Rd',
    '654 Warehouse Avenue',
    '987 Supply Chain Street',
    '147 Logistics Lane',
    '258 Trade Center Drive',
  ];
  const cities = [
    'Atlanta', 'Chicago', 'Dallas', 'Denver', 'Houston', 'Los Angeles',
    'Miami', 'New York', 'Phoenix', 'Seattle', 'Boston', 'Philadelphia',
  ];
  const states = [
    'AL', 'AZ', 'CA', 'CO', 'FL', 'GA', 'IL', 'MA', 'NY', 'PA', 'TX', 'WA',
  ];
  
  const street = streets[Math.floor(Math.random() * streets.length)];
  const streetNumber = Math.floor(Math.random() * 9000) + 100;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  const country = 'USA';
  
  return {
    street: `${streetNumber} ${street}`,
    city,
    state,
    zipCode: zipCode.toString(),
    country,
  };
};

// Generate fake portal URL
const generateFakePortalUrl = (companyName: string): string => {
  const protocols = ['https://', 'http://'];
  const subdomains = ['portal', 'returns', 'portal.returns', 'www', 'secure'];
  const tlds = ['.com', '.net', '.org'];
  
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];
  const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  const tld = tlds[Math.floor(Math.random() * tlds.length)];
  
  return `${protocol}${subdomain}.${companySlug}${tld}`;
};

// Generate fake supported formats
const generateFakeSupportedFormats = (): string[] => {
  const allFormats = ['PDF', 'CSV', 'Excel', 'XML', 'EDI', 'JSON'];
  const numFormats = Math.floor(Math.random() * 3) + 1; // 1-3 formats
  const formats: string[] = [];
  
  // Always include PDF
  formats.push('PDF');
  
  // Add random other formats
  const otherFormats = allFormats.filter(f => f !== 'PDF');
  for (let i = 0; i < numFormats - 1 && i < otherFormats.length; i++) {
    const randomFormat = otherFormats[Math.floor(Math.random() * otherFormats.length)];
    if (!formats.includes(randomFormat)) {
      formats.push(randomFormat);
    }
  }
  
  return formats;
};

// Replace real prices and distributor name with fake ones
const fakePricesAndDistributor = (data: ReturnReportData): ReturnReportData => {
  // Generate a fake distributor name
  const fakeDistributorName = generateFakeDistributorName();
  
  // Replace distributor name (for backward compatibility)
  data.reverseDistributor = fakeDistributorName;
  
  // Generate fake distributor information
  const fakeEmail = generateFakeEmail(fakeDistributorName);
  const fakePhone = generateFakePhone();
  const fakeAddress = generateFakeAddress();
  const fakePortalUrl = generateFakePortalUrl(fakeDistributorName);
  const fakeSupportedFormats = generateFakeSupportedFormats();
  
  // Replace distributor info with fake data
  if (data.reverseDistributorInfo) {
    data.reverseDistributorInfo.name = fakeDistributorName;
    data.reverseDistributorInfo.contactEmail = fakeEmail;
    data.reverseDistributorInfo.contactPhone = fakePhone;
    data.reverseDistributorInfo.address = fakeAddress;
    data.reverseDistributorInfo.portalUrl = fakePortalUrl;
    data.reverseDistributorInfo.supportedFormats = fakeSupportedFormats;
  } else {
    // Create distributor info structure with fake data
    data.reverseDistributorInfo = {
      name: fakeDistributorName,
      contactEmail: fakeEmail,
      contactPhone: fakePhone,
      address: fakeAddress,
      portalUrl: fakePortalUrl,
      supportedFormats: fakeSupportedFormats,
    };
  }
  
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

  // Ensure backward compatibility: set reverseDistributor from reverseDistributorInfo if needed
  if (structuredData.reverseDistributorInfo?.name && !structuredData.reverseDistributor) {
    structuredData.reverseDistributor = structuredData.reverseDistributorInfo.name;
  } else if (structuredData.reverseDistributor && !structuredData.reverseDistributorInfo) {
    // Create basic distributor info from name if not provided
    structuredData.reverseDistributorInfo = {
      name: structuredData.reverseDistributor,
    };
  }

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

  // Validate NDC codes before inserting
  const validatedItems: any[] = [];
  const invalidItems: any[] = [];

  for (const item of items) {
    const ndcCode = item.ndcCode;
    
    if (!ndcCode) {
      invalidItems.push({ ...item, reason: 'Missing NDC code' });
      console.log(`❌ Invalid NDC: MISSING - Item: ${item.itemName || 'Unknown'}`);
      continue;
    }

    // Check if NDC exists in ndc_products or ndc_packages
    const [productCheck, packageCheck] = await Promise.all([
      db.from('ndc_products')
        .select('product_ndc')
        .eq('product_ndc', ndcCode)
        .limit(1)
        .maybeSingle(),
      db.from('ndc_packages')
        .select('ndc_package_code')
        .eq('ndc_package_code', ndcCode)
        .limit(1)
        .maybeSingle(),
    ]);

    // If found in either table, it's valid
    const foundInProducts = productCheck.data !== null;
    const foundInPackages = packageCheck.data !== null;
    
    if (foundInProducts || foundInPackages) {
      validatedItems.push(item);
    } else {
      invalidItems.push({ ...item, reason: 'NDC code not found in database' });
      console.log(`❌ Invalid NDC: "${ndcCode}" - Item: ${item.itemName || 'Unknown'} - Not found in ndc_products or ndc_packages`);
    }
  }

  // Log validation results
  if (invalidItems.length > 0) {
    console.log(`\n⚠️  ${invalidItems.length} items skipped due to invalid/missing NDC codes`);
    console.log(`📋 Invalid NDC Codes List:`);
    invalidItems.forEach((item, index) => {
      console.log(`   ${index + 1}. NDC: "${item.ndcCode || 'MISSING'}" - ${item.itemName || 'Unknown'} - Reason: ${item.reason}`);
    });
  }
  console.log(`\n✅ ${validatedItems.length} items with valid NDC codes will be inserted`);

  if (validatedItems.length === 0) {
    throw new AppError('No items with valid NDC codes to save', 400);
  }

  // Create one record per validated item
  const recordsToInsert = validatedItems.map((item: any) => ({
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

