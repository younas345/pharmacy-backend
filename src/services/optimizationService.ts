import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface OptimizationRecommendation {
  id?: string;
  ndc: string;
  productName: string;
  quantity: number;
  lotNumber?: string;
  expirationDate?: string;
  recommendedDistributor: string;
  recommendedDistributorContact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  expectedPrice: number;
  worstPrice: number;
  available?: boolean;
  alternativeDistributors: Array<{
    name: string;
    price: number;
    difference: number;
    available?: boolean;
    email?: string;
    phone?: string;
    location?: string;
  }>;
  savings: number;
  _distributorAverages?: Array<{ name: string; price: number }>; // Temporary storage for availability check
}

export interface OptimizationResponse {
  recommendations: OptimizationRecommendation[];
  totalPotentialSavings: number;
  generatedAt: string;
  distributorUsage: {
    usedThisMonth: number;
    totalDistributors: number;
    stillAvailable: number;
  };
  earningsComparison: {
    singleDistributorStrategy: number;
    multipleDistributorsStrategy: number;
    potentialAdditionalEarnings: number;
  };
}

// Get optimization recommendations for pharmacy products
export const getOptimizationRecommendations = async (
  pharmacyId: string,
  searchNdcs?: string[]
): Promise<OptimizationResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  let ndcs: string[] = [];
  let productItems: Array<{ id: string; ndc: string; product_name: string; quantity: number; lot_number?: string; expiration_date?: string }> = [];
  const isSearchMode = searchNdcs && searchNdcs.length > 0;

  // If NDC search parameter is provided, use those NDCs for partial matching
  if (isSearchMode) {
    // Use the provided NDCs for search (these are search terms, may be partial)
    const searchTerms = [...new Set(searchNdcs.map(n => String(n).replace(/-/g, '').trim()))];
    console.log(`🔍 Using search NDCs (partial match mode):`, searchTerms);
    
    // Store search terms for later matching
    ndcs = searchTerms;
    
    // Try to get product names and quantities from product_list_items for exact matches
    // But we'll also find matches through partial search in return_reports
    const { data: foundProducts } = await db
      .from('product_list_items')
      .select('id, ndc, product_name, quantity, lot_number, expiration_date')
      .eq('added_by', pharmacyId);
    
    // Create a map of found products for reference
    const productMap = new Map(
      (foundProducts || []).map(p => [String(p.ndc).replace(/-/g, '').trim(), p])
    );
    
    console.log(`📋 Pharmacy has ${foundProducts?.length || 0} products in inventory`);
    if (foundProducts && foundProducts.length > 0) {
      console.log(`📋 Pharmacy product NDCs:`, foundProducts.map(p => p.ndc));
    }
    
    // Initialize product items with search terms (will be updated with actual matches later)
    productItems = searchTerms.map(searchTerm => {
      // Try to find exact match first in pharmacy's inventory
      const found = productMap.get(searchTerm);
      if (found) {
        console.log(`✅ Found search term "${searchTerm}" in pharmacy inventory as "${found.ndc}"`);
        // Return the product with its ORIGINAL NDC format from pharmacy inventory
        return {
          id: found.id,
          ndc: found.ndc, // ✅ Use original NDC format from pharmacy
          product_name: found.product_name,
          quantity: found.quantity,
          lot_number: found.lot_number,
          expiration_date: found.expiration_date,
        };
      } else {
        console.log(`⚠️ Search term "${searchTerm}" NOT found in pharmacy inventory`);
        return {
          id: '',
          ndc: searchTerm, // Use normalized version as fallback
          product_name: `Product ${searchTerm}`,
          quantity: 1,
          lot_number: undefined,
          expiration_date: undefined,
        };
      }
    });
  } else {
    // Step 1: Get all product list items for this pharmacy
    const { data: items, error: itemsError } = await db
      .from('product_list_items')
      .select('id, ndc, product_name, quantity, lot_number, expiration_date')
      .eq('added_by', pharmacyId);

    if (itemsError) {
      throw new AppError(`Failed to fetch product list items: ${itemsError.message}`, 400);
    }

    if (!items || items.length === 0) {
      // Get total active distributors for empty response
      const { data: allActiveDistributors } = await db
        .from('reverse_distributors')
        .select('id')
        .eq('is_active', true);
      
      const totalDistributors = allActiveDistributors?.length || 0;
      
      return {
        recommendations: [],
        totalPotentialSavings: 0,
        generatedAt: new Date().toISOString(),
        distributorUsage: {
          usedThisMonth: 0,
          totalDistributors,
          stillAvailable: totalDistributors,
        },
        earningsComparison: {
          singleDistributorStrategy: 0,
          multipleDistributorsStrategy: 0,
          potentialAdditionalEarnings: 0,
        },
      };
    }

    productItems = items;
    // Step 2: Extract unique NDCs
    ndcs = [...new Set(productItems.map((item) => item.ndc))];
  }

  // Step 3: Search return_reports for matching NDCs
  // Join with uploaded_documents and reverse_distributors to get distributor name
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      uploaded_documents (
        reverse_distributor_id,
        reverse_distributors (
          id,
          name
        )
      )
    `);

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  // Pre-create normalized NDC lookup for faster matching in non-search mode
  const normalizedNdcLookup = new Map<string, string>();
  if (!isSearchMode) {
    ndcs.forEach(ndc => {
      const normalized = String(ndc).replace(/-/g, '').trim();
      normalizedNdcLookup.set(normalized, ndc);
    });
  }

  console.log(`📦 Found ${returnReports?.length || 0} return report records`);
  console.log(`🔍 Looking for NDCs:`, ndcs);
  if (isSearchMode && searchNdcs) {
    console.log(`🔍 Original search NDCs (from query param):`, searchNdcs);
    console.log(`🔍 Normalized search NDCs (for matching):`, ndcs);
  }
  
  // Debug: Check what distributors we have in the data
  const allDistributors = new Set<string>();
  (returnReports || []).forEach((report: any) => {
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           report.data?.reverseDistributor || 
                           report.data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';
    if (distributorName && distributorName !== 'Unknown Distributor') {
      allDistributors.add(distributorName);
    }
  });
  console.log(`🏢 All distributors in data:`, Array.from(allDistributors));

  // Step 4: Process the data - match NDCs and group by distributor
  const ndcPricingMap: Record<
    string,
    Array<{
      distributorName: string;
      pricePerUnit: number;
      creditAmount: number;
      quantity: number;
    }>
  > = {};

  // Map to track which search term matched which actual NDC (for search mode)
  const searchTermToActualNdc: Record<string, string> = {};
  
  // Map to track product names from return_reports (for NDCs not in pharmacy inventory)
  const ndcToProductNameMap: Record<string, string> = {};

  // Initialize map for all NDCs
  ndcs.forEach((ndc) => {
    ndcPricingMap[ndc] = [];
  });

  // Process return reports
  // Each return_reports record contains a single item in the data field
  if (isSearchMode) {
    console.log(`\n=== PROCESSING RETURN REPORTS FOR SEARCH MODE ===`);
  }
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    
    if (isSearchMode) {
      console.log(`\n📄 Processing report ${report.id}`);
      console.log(`   Data keys:`, data ? Object.keys(data) : 'null');
      console.log(`   Data.ndcCode:`, data?.ndcCode);
      console.log(`   Data.ndc:`, data?.ndc);
    }
    
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           data?.reverseDistributor || 
                           data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';
    
    // Debug: Log distributor extraction
    console.log(`🔍 Report ${report.id}: distributor = "${distributorName}"`);
    
    // Ensure we have a valid distributor name
    if (!distributorName || distributorName === 'Unknown Distributor') {
      console.warn('⚠️ No distributor name found for return report:', report.id, 'data keys:', Object.keys(data || {}));
    }

    // Handle different data structures:
    // 1. If data has items array, use that (legacy format)
    // 2. If data itself is an item (current format - each record is one item), use it directly
    let items: any[] = [];
    
    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) {
        // Legacy format with items array
        items = data.items;
      } else if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        // Single item object in items field
        items = [data.items];
      } else if (data.ndcCode || data.ndc) {
        // Data itself is an item (current format - most common)
        items = [data];
      }
    }

    items.forEach((item: any) => {
      // Try different possible field names for NDC
      const ndcCode = item.ndcCode || item.ndc;
      
      if (!ndcCode) {
        if (isSearchMode) {
          console.log(`⚠️ No NDC found in item. Item keys:`, Object.keys(item || {}));
        }
        return;
      }

      // Normalize NDC for comparison (remove dashes and convert to string)
      const normalizedNdcCode = String(ndcCode).replace(/-/g, '').trim();
      
      // Debug logging for search mode
      if (isSearchMode) {
        console.log(`🔍 Checking NDC: "${ndcCode}" (normalized: "${normalizedNdcCode}") against search terms:`, ndcs);
      }
      
      // Find matching NDC from product list or search terms
      let matchingNdc: string | undefined;
      let actualNdcKey: string; // The key to use in ndcPricingMap
      
      if (isSearchMode) {
        // Exact match mode: check if normalized NDC exactly matches any search term
        // In search mode, ndcs array already contains normalized search terms (from line 71)
        const matchedSearchTerm = ndcs.find(searchTerm => {
          // searchTerm is already normalized (no dashes) from line 67-71
          const normalizedSearchTerm = String(searchTerm).replace(/-/g, '').trim();
          // Use exact match for better accuracy when user provides specific NDC
          return normalizedNdcCode === normalizedSearchTerm;
        });
        
        if (!matchedSearchTerm) {
          if (isSearchMode) {
            console.log(`❌ NDC "${ndcCode}" (normalized: "${normalizedNdcCode}") did not match any search term`);
          }
          return;
        }
        
        // Use the ORIGINAL NDC format from return_reports (preserve dashes)
        const originalNdcFormat = String(ndcCode).trim();
        actualNdcKey = originalNdcFormat;
        matchingNdc = matchedSearchTerm;
        
        // Track which search term matched which actual NDC (store original format with dashes)
        searchTermToActualNdc[matchedSearchTerm] = originalNdcFormat;
        
        // Extract product name from return_reports data field (try various field names)
        // Priority: itemName (most common in return_reports.data) > productName > product_name > product > description > drugName > name
        const productName = item.itemName || item.productName || item.product_name || item.product || item.description || item.drugName || item.name;
        if (productName && !ndcToProductNameMap[originalNdcFormat]) {
          const fieldName = item.itemName ? 'itemName' : item.productName ? 'productName' : item.product_name ? 'product_name' : 'other';
          ndcToProductNameMap[originalNdcFormat] = String(productName).trim();
          console.log(`✅ Matched! Search term "${matchedSearchTerm}" → Actual NDC "${originalNdcFormat}"`);
          console.log(`   📦 Product name from return_reports.data.${fieldName}: "${productName}"`);
        } else if (productName && ndcToProductNameMap[originalNdcFormat]) {
          console.log(`✅ Matched! Search term "${matchedSearchTerm}" → Actual NDC "${originalNdcFormat}" (product name already stored)`);
        } else {
          console.log(`✅ Matched! Search term "${matchedSearchTerm}" → Actual NDC "${originalNdcFormat}" (no product name in return_reports data)`);
        }
        
        // Initialize map entry for actual NDC if not exists
        if (!ndcPricingMap[actualNdcKey]) {
          ndcPricingMap[actualNdcKey] = [];
        }
      } else {
        // Exact match mode: use pre-computed lookup map for O(1) access
        matchingNdc = normalizedNdcLookup.get(normalizedNdcCode);
        
        if (!matchingNdc) {
          // Fallback to original matching logic for edge cases
        matchingNdc = ndcs.find(n => {
            return String(n).trim() === String(ndcCode).trim();
        });
        }
        
        if (!matchingNdc) {
          return;
        }
        
        actualNdcKey = matchingNdc;
      }

      const quantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit = Number(item.pricePerUnit) || (quantity > 0 && creditAmount > 0 ? creditAmount / quantity : 0);

      if (pricePerUnit > 0) {
        ndcPricingMap[actualNdcKey].push({
          distributorName,
          pricePerUnit,
          creditAmount,
          quantity,
        });
        console.log(`✅ Matched NDC ${actualNdcKey} (search term: ${matchingNdc}) with distributor "${distributorName}", price: ${pricePerUnit}`);
      } else {
        console.log(`❌ Skipped NDC ${actualNdcKey} - invalid price: ${pricePerUnit}`);
      }
    });
  });

  // Debug: Log pricing map summary
  console.log(`\n=== PRICING MAP SUMMARY ===`);
  Object.entries(ndcPricingMap).forEach(([ndc, pricing]) => {
    if (pricing.length > 0) {
      const uniqueDistributors = [...new Set(pricing.map(p => p.distributorName))];
      console.log(`📊 NDC ${ndc}:`);
      console.log(`   - ${pricing.length} total records`);
      console.log(`   - ${uniqueDistributors.length} unique distributors: [${uniqueDistributors.join(', ')}]`);
      
      // Show detailed breakdown
      const distributorBreakdown: Record<string, number[]> = {};
      pricing.forEach(p => {
        if (!distributorBreakdown[p.distributorName]) {
          distributorBreakdown[p.distributorName] = [];
        }
        distributorBreakdown[p.distributorName].push(p.pricePerUnit);
      });
      
      Object.entries(distributorBreakdown).forEach(([dist, prices]) => {
        console.log(`     * ${dist}: ${prices.length} records, prices: [${prices.join(', ')}]`);
      });
    } else {
      console.log(`📊 NDC ${ndc}: No pricing data found`);
    }
  });
  console.log(`=== END PRICING MAP ===\n`);

  // Step 5: Generate recommendations
  const recommendations: OptimizationRecommendation[] = [];

  // In search mode, update productItems to use actual matched NDCs
  if (isSearchMode && Object.keys(searchTermToActualNdc).length > 0) {
    console.log(`\n=== MERGING PHARMACY PRODUCTS WITH RETURN REPORTS ===`);
    console.log(`searchTermToActualNdc map:`, searchTermToActualNdc);
    console.log(`productItems from pharmacy:`, productItems.map(p => ({ ndc: p.ndc, name: p.product_name })));
    
    // Create a map of actual NDCs to product info
    const actualNdcToProduct: Map<string, { 
      id: string; 
      product_name: string; 
      quantity: number; 
      lot_number?: string; 
      expiration_date?: string;
    }> = new Map();
    
    productItems.forEach(item => {
      // Normalize item.ndc to match against searchTermToActualNdc keys
      const normalizedItemNdc = String(item.ndc).replace(/-/g, '').trim();
      const actualNdc = searchTermToActualNdc[normalizedItemNdc];
      
      console.log(`  Checking item.ndc="${item.ndc}" (normalized="${normalizedItemNdc}") → actualNdc="${actualNdc || 'NOT FOUND'}"`);
      
      if (actualNdc) {
        // Use actual NDC from return_reports, keep product info from pharmacy
        if (!actualNdcToProduct.has(actualNdc)) {
          console.log(`  ✅ Adding actualNdc="${actualNdc}" with pharmacy product info`);
          actualNdcToProduct.set(actualNdc, {
            id: item.id || '',
            product_name: item.product_name === `Product ${item.ndc}` 
              ? `Product ${actualNdc}` 
              : item.product_name,
            quantity: item.quantity,
            lot_number: item.lot_number,
            expiration_date: item.expiration_date,
          });
        }
      }
    });
    
    // Add any matched NDCs from searchTermToActualNdc that weren't in productItems
    // This handles the case where the NDC was found in return_reports but not in pharmacy's inventory
    for (const [searchTerm, actualNdc] of Object.entries(searchTermToActualNdc)) {
      if (!actualNdcToProduct.has(actualNdc)) {
        console.log(`✨ Adding matched NDC ${actualNdc} from return_reports (not in pharmacy inventory)`);
        
        // Try to get product name from return_reports.data first (from itemName field)
        let productName = ndcToProductNameMap[actualNdc];
        
        // If not in return_reports, try to fetch from products table
        if (!productName) {
          console.log(`   🔍 Product name not found in return_reports.data, fetching from products table for NDC ${actualNdc}...`);
          const { data: productData } = await db
            .from('products')
            .select('product_name')
            .eq('ndc', actualNdc)
            .limit(1)
            .maybeSingle();
          
          if (productData?.product_name) {
            productName = productData.product_name;
            console.log(`   ✅ Found product name in products table: "${productName}"`);
          } else {
            // Also try with normalized NDC (without dashes)
            const normalizedNdc = String(actualNdc).replace(/-/g, '').trim();
            const { data: productData2 } = await db
              .from('products')
              .select('product_name')
              .eq('ndc', normalizedNdc)
              .limit(1)
              .maybeSingle();
            
            if (productData2?.product_name) {
              productName = productData2.product_name;
              console.log(`   ✅ Found product name in products table (normalized): "${productName}"`);
            } else {
              productName = `Product ${actualNdc}`;
              console.log(`   ⚠️ Product name not found anywhere, using default: "${productName}"`);
            }
          }
        } else {
          console.log(`   ✅ Using product name from return_reports.data.itemName: "${productName}"`);
        }
        
        actualNdcToProduct.set(actualNdc, {
          id: '',
          product_name: productName,
          quantity: 1, // Default quantity for searched items
          lot_number: undefined,
          expiration_date: undefined,
        });
      }
    }
    
    // Update productItems with actual NDCs
    productItems = Array.from(actualNdcToProduct.entries()).map(([ndc, info]) => ({
      id: info.id,
      ndc,
      product_name: info.product_name,
      quantity: info.quantity,
      lot_number: info.lot_number,
      expiration_date: info.expiration_date,
    }));
    
    console.log(`📦 Final productItems (${productItems.length} items):`, productItems.map(p => ({ ndc: p.ndc, name: p.product_name, qty: p.quantity })));
    console.log(`=== END MERGING ===\n`);
    
    // Update ndcs array with actual matched NDCs
    ndcs = [...new Set(Array.from(actualNdcToProduct.keys()))];
  }

  productItems.forEach((productItem) => {
    const ndc = productItem.ndc;
    const pricingData = ndcPricingMap[ndc] || [];

    if (pricingData.length === 0) {
      // No pricing data found for this NDC
      return;
    }

    // Group by distributor and get average price per unit
    // Use a Map to ensure we properly track all unique distributors
    const distributorPrices: Record<
      string,
      { totalPrice: number; totalQuantity: number; count: number; prices: number[] }
    > = {};

    pricingData.forEach((pricing) => {
      const distName = (pricing.distributorName || 'Unknown Distributor').trim();
      if (!distributorPrices[distName]) {
        distributorPrices[distName] = {
          totalPrice: 0,
          totalQuantity: 0,
          count: 0,
          prices: [],
        };
      }
      distributorPrices[distName].totalPrice += pricing.pricePerUnit;
      distributorPrices[distName].totalQuantity += pricing.quantity;
      distributorPrices[distName].count += 1;
      distributorPrices[distName].prices.push(pricing.pricePerUnit);
    });

    // Debug: Log distributor processing for this NDC
    const distributorCount = Object.keys(distributorPrices).length;
    console.log(`\n--- Processing NDC ${ndc} ---`);
    console.log(`Raw pricing data entries: ${pricingData.length}`);
    console.log(`Unique distributors after grouping: ${distributorCount}`);
    
    Object.entries(distributorPrices).forEach(([distName, data]) => {
      console.log(`  "${distName}": ${data.count} records, avg price: ${(data.totalPrice / data.count).toFixed(3)}`);
    });
    
    if (distributorCount === 1) {
      console.log(`⚠️ Only 1 distributor found for NDC ${ndc} - no alternatives possible`);
    }

    // Calculate average price per distributor
    const distributorAverages: Array<{ name: string; price: number }> = Object.entries(
      distributorPrices
    )
      .filter(([_, data]) => data.count > 0) // Ensure we have valid data
      .map(([name, data]) => ({
        name: name.trim(),
        price: data.totalPrice / data.count, // Average price per unit
      }));

    if (distributorAverages.length === 0) {
      return;
    }

    // Sort by price (highest first = best) - highest price means highest credit/return value
    distributorAverages.sort((a, b) => b.price - a.price);

    // Store distributor averages for later use (before availability check)
    const allDistributorsSorted = distributorAverages;

    // Debug: Log final results
    console.log(`📊 Final result for NDC ${ndc}:`);
    console.log(`   - Total distributors: ${distributorAverages.length}`);
    console.log(`--- End NDC ${ndc} ---\n`);

    // Store the distributor averages for this NDC (we'll select recommended after availability check)
    recommendations.push({
      id: productItem.id,
      ndc,
      productName: productItem.product_name || `Product ${ndc}`,
      quantity: productItem.quantity || 1,
      lotNumber: productItem.lot_number || undefined,
      expirationDate: productItem.expiration_date || undefined,
      recommendedDistributor: '', // Will be set after availability check
      expectedPrice: 0, // Will be set after availability check
      worstPrice: distributorAverages[distributorAverages.length - 1].price, // Lowest price
      alternativeDistributors: [], // Will be set after availability check
      savings: 0, // Will be calculated after availability check
      _distributorAverages: allDistributorsSorted, // Temporary storage for availability check
    });
  });

  // Collect all unique distributor names from recommendations (before availability check)
  const distributorNames = new Set<string>();
  recommendations.forEach((rec) => {
    rec._distributorAverages?.forEach((dist) => {
      distributorNames.add(dist.name);
    });
  });

  // Fetch distributor IDs and contact info from reverse_distributors table
  const distributorNameToIdMap: Record<string, string> = {};
  const distributorContactInfoMap: Record<string, {
    email?: string;
    phone?: string;
    location?: string;
  }> = {};
  
  if (distributorNames.size > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('name', Array.from(distributorNames));

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        distributorNameToIdMap[dist.name] = dist.id;
        
        // Format location from address - combine all components into one string
        let location: string | undefined;
        if (dist.address) {
          const addr = dist.address;
          const locationParts: string[] = [];
          
          // Add street if available
          if (addr.street) {
            locationParts.push(addr.street);
          }
          
          // Add city if available
          if (addr.city) {
            locationParts.push(addr.city);
          }
          
          // Add state if available
          if (addr.state) {
            locationParts.push(addr.state);
          }
          
          // Add zipCode if available
          if (addr.zipCode) {
            locationParts.push(addr.zipCode);
          }
          
          // Add country if available
          if (addr.country) {
            locationParts.push(addr.country);
          }
          
          // Combine all parts with comma and space
          if (locationParts.length > 0) {
            location = locationParts.join(', ');
          }
        }
        
        distributorContactInfoMap[dist.name] = {
          email: dist.contact_email || undefined,
          phone: dist.contact_phone || undefined,
          location,
        };
      });
    }
  }

  // COMMENTED OUT: Check availability for each distributor
  // Get the most recent report_date for each pharmacy-distributor combination
  // const distributorAvailabilityMap: Record<string, boolean> = {};
  
  // for (const distributorName of distributorNames) {
  //   const distributorId = distributorNameToIdMap[distributorName];
  //   
  //   if (!distributorId) {
  //     // If distributor not found, mark as unavailable
  //     distributorAvailabilityMap[distributorName] = false;
  //     continue;
  //   }

  //   // Get the most recent report_date for this pharmacy-distributor combination
  //   const { data: recentDocuments, error: docError } = await db
  //     .from('uploaded_documents')
  //     .select('report_date')
  //     .eq('pharmacy_id', pharmacyId)
  //     .eq('reverse_distributor_id', distributorId)
  //     .not('report_date', 'is', null)
  //     .order('report_date', { ascending: false })
  //     .limit(1);

  //   if (docError || !recentDocuments || recentDocuments.length === 0 || !recentDocuments[0]?.report_date) {
  //     // No data found, mark as available (no recent activity)
  //     distributorAvailabilityMap[distributorName] = true;
  //     continue;
  //   }

  //   const recentDocument = recentDocuments[0];

  //   // Check if report_date is within last 30 days
  //   const reportDate = new Date(recentDocument.report_date);
  //   const today = new Date();
  //   const thirtyDaysAgo = new Date();
  //   thirtyDaysAgo.setDate(today.getDate() - 30);
  //   const reportDateStr = reportDate.toISOString().split('T')[0];
  //   const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  //   
  //   // If report_date is within last 30 days, mark as unavailable (active = false)
  //   // Otherwise, mark as available (active = true)
  //   distributorAvailabilityMap[distributorName] = reportDateStr < thirtyDaysAgoStr;
  // }

  // Now update recommendations: select highest price distributor as recommended (no availability check)
  recommendations.forEach((rec) => {
    if (!rec._distributorAverages || rec._distributorAverages.length === 0) {
      return;
    }

    // COMMENTED OUT: Find the highest price distributor that IS available
    // Now just use the highest price distributor (first one since already sorted)
    let recommended: { name: string; price: number } | null = null;
    const alternatives: Array<{ 
      name: string; 
      price: number; 
      difference: number; 
      available: boolean;
      email?: string;
      phone?: string;
      location?: string;
    }> = [];

    // COMMENTED OUT: First, find the highest available distributor
    // for (const dist of rec._distributorAverages) {
    //   const isAvailable = distributorAvailabilityMap[dist.name] ?? false;
    //   
    //   if (!recommended && isAvailable) {
    //     // First available distributor (which is also highest price since sorted)
    //     recommended = dist;
    //     break; // Found the recommended one
    //   }
    // }

    // If no available distributor found, use the highest price one anyway (even if unavailable)
    // CHANGED: Just use the highest price distributor (first one since sorted by price desc)
    if (rec._distributorAverages.length > 0) {
      recommended = rec._distributorAverages[0]; // Highest price distributor
    }

    // Now build alternatives list (all distributors except the recommended one)
    if (recommended) {
      rec._distributorAverages.forEach((dist) => {
        if (dist.name !== recommended!.name) {
          const contactInfo = distributorContactInfoMap[dist.name] || {};
          alternatives.push({
            name: dist.name,
            price: dist.price,
            difference: dist.price - recommended!.price, // Negative means lower price (worse)
            // available: distributorAvailabilityMap[dist.name] ?? false,
            email: contactInfo.email,
            phone: contactInfo.phone,
            location: contactInfo.location,
            // COMMENTED OUT: available: distributorAvailabilityMap[dist.name] ?? false,
            available: true, // Always mark as available since we're not checking
          });
        }
      });
    }

    if (recommended) {
      const recommendedContactInfo = distributorContactInfoMap[recommended.name] || {};
      rec.recommendedDistributor = recommended.name;
      rec.recommendedDistributorContact = {
        email: recommendedContactInfo.email,
        phone: recommendedContactInfo.phone,
        location: recommendedContactInfo.location,
      };
      rec.expectedPrice = recommended.price;
      // COMMENTED OUT: rec.available = distributorAvailabilityMap[recommended.name] ?? false;
      rec.available = true; // Always mark as available since we're not checking
      rec.alternativeDistributors = alternatives;
      
      // Calculate savings (difference between recommended and worst price)
      const worstPrice = rec.worstPrice;
      rec.savings = Math.max(0, (recommended.price - worstPrice) * (rec.quantity || 1));
    }

    // Remove temporary storage
    delete (rec as any)._distributorAverages;
  });

  // Calculate total potential savings after updating recommendations
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);

  // Calculate distributor usage statistics
  // Calculate 30 days ago once
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Fetch all data in parallel for better performance
  const [activeDistributorsResult, documentsResult] = await Promise.all([
    db.from('reverse_distributors').select('id').eq('is_active', true),
    db.from('uploaded_documents')
      .select('reverse_distributor_id, report_date')
        .eq('pharmacy_id', pharmacyId)
        .not('report_date', 'is', null)
        .order('report_date', { ascending: false })
  ]);

  const allActiveDistributors = activeDistributorsResult.data || [];
  const totalDistributors = allActiveDistributors.length;

  // Build a map of most recent report date per distributor
  const distributorLastReportMap = new Map<string, string>();
  if (documentsResult.data) {
    for (const doc of documentsResult.data) {
      if (doc.reverse_distributor_id && doc.report_date) {
        const existing = distributorLastReportMap.get(doc.reverse_distributor_id);
        // Keep only the most recent date (data is already sorted desc)
        if (!existing) {
          distributorLastReportMap.set(doc.reverse_distributor_id, doc.report_date);
        }
      }
    }
  }

  // Count distributors used this month
  let usedThisMonth = 0;
  for (const dist of allActiveDistributors) {
    const lastReportDate = distributorLastReportMap.get(dist.id);
    if (lastReportDate) {
      const reportDateStr = new Date(lastReportDate).toISOString().split('T')[0];
      if (reportDateStr >= thirtyDaysAgoStr) {
        usedThisMonth++;
      }
    }
  }

  const stillAvailable = Math.max(0, totalDistributors - usedThisMonth);

  // COMMENTED OUT: Create a map to check if a distributor (by name) is still available this month
  // A distributor is "still available this month" if last document's report_date is NOT within last 30 days
  // const distributorNameToStillAvailableMap: Record<string, boolean> = {};
  
  // // Check each distributor name - use same logic: order by report_date DESC and check latest
  // for (const distributorName of distributorNames) {
  //   const distributorId = distributorNameToIdMap[distributorName];
  //   
  //   if (!distributorId) {
  //     // If we don't have an ID, assume it's available
  //     distributorNameToStillAvailableMap[distributorName] = true;
  //     continue;
  //   }

  //   // Get the most recent document for this pharmacy and distributor (by report_date)
  //   const { data: lastDocument, error: docError } = await db
  //     .from('uploaded_documents')
  //     .select('report_date')
  //     .eq('pharmacy_id', pharmacyId)
  //     .eq('reverse_distributor_id', distributorId)
  //     .not('report_date', 'is', null)
  //     .order('report_date', { ascending: false })
  //     .limit(1)
  //     .maybeSingle();

  //   if (docError || !lastDocument || !lastDocument.report_date) {
  //     // No document found, mark as available
  //     distributorNameToStillAvailableMap[distributorName] = true;
  //     continue;
  //   }

  //   // Check if last document's report_date is within last 30 days
  //   const reportDateStr = new Date(lastDocument.report_date).toISOString().split('T')[0];
  //   // If within 30 days, NOT available (used this month)
  //   // If older than 30 days, available (still available this month)
  //   distributorNameToStillAvailableMap[distributorName] = reportDateStr < thirtyDaysAgoStr;
  // }
  
  // CHANGED: Mark all distributors as available since we're not checking
  const distributorNameToStillAvailableMap: Record<string, boolean> = {};
  for (const distributorName of distributorNames) {
    distributorNameToStillAvailableMap[distributorName] = true;
  }

  // Calculate earnings comparison
  // Single Distributor Strategy: Pick ONE distributor and use it for ALL products
  // Find which single distributor gives the best total earnings across all products
  const allDistributorNames = new Set<string>();
  recommendations.forEach((rec) => {
    allDistributorNames.add(rec.recommendedDistributor);
    rec.alternativeDistributors.forEach((alt) => {
      allDistributorNames.add(alt.name);
    });
  });

  // Calculate total earnings for each distributor if used for ALL products
  const distributorTotalEarnings: Record<string, number> = {};
  
  for (const distributorName of allDistributorNames) {
    // COMMENTED OUT: const stillAvailable = distributorNameToStillAvailableMap[distributorName] ?? false;
    // COMMENTED OUT: if (!stillAvailable) continue; // Skip distributors not available this month
    
    let totalEarnings = 0;
    
    recommendations.forEach((rec) => {
      // Find price for this distributor for this product
      let price: number | null = null;
      
      if (rec.recommendedDistributor === distributorName) {
        price = rec.expectedPrice;
      } else {
        const altDist = rec.alternativeDistributors.find(alt => alt.name === distributorName);
        if (altDist) {
          price = altDist.price;
        }
      }
      
      // If distributor has this product, use their price; otherwise use worst price (conservative estimate)
      const finalPrice = price !== null ? price : rec.worstPrice;
      totalEarnings += finalPrice * rec.quantity;
    });
    
    distributorTotalEarnings[distributorName] = totalEarnings;
  }

  // Find the best single distributor (highest total earnings)
  const bestSingleDistributor = Object.entries(distributorTotalEarnings)
    .sort((a, b) => b[1] - a[1])[0];
  
  const singleDistributorStrategy = bestSingleDistributor ? bestSingleDistributor[1] : 0;

  // Multiple Distributors Strategy: Using the best distributor that's still available this month for each product
  // This allows using different distributors for different products to maximize earnings
  let multipleDistributorsStrategy = 0;

  recommendations.forEach((rec) => {
    // Find the best distributor that's still available this month (including recommended and alternatives)
    const allOptions = [
      { 
        name: rec.recommendedDistributor, 
        price: rec.expectedPrice, 
        stillAvailableThisMonth: distributorNameToStillAvailableMap[rec.recommendedDistributor] ?? false 
      },
      ...rec.alternativeDistributors.map((alt) => ({
        name: alt.name,
        price: alt.price,
        stillAvailableThisMonth: distributorNameToStillAvailableMap[alt.name] ?? false,
      })),
    ];

    // COMMENTED OUT: Filter to only distributors still available this month and sort by price (highest first)
    // CHANGED: Just sort by price (highest first) without filtering by availability
    const availableThisMonthOptions = allOptions
      // COMMENTED OUT: .filter((opt) => opt.stillAvailableThisMonth)
      .sort((a, b) => b.price - a.price);

    if (availableThisMonthOptions.length > 0) {
      // Use the best distributor (highest price)
      const bestAvailable = availableThisMonthOptions[0];
      const earnings = bestAvailable.price * rec.quantity;
      multipleDistributorsStrategy += earnings;
    } else {
      // If no distributors found, use the recommended one anyway
      const earnings = rec.expectedPrice * rec.quantity;
      multipleDistributorsStrategy += earnings;
    }
  });

  const potentialAdditionalEarnings = Math.max(0, multipleDistributorsStrategy - singleDistributorStrategy);

  // Filter recommendations by search NDCs if in search mode
  let filteredRecommendations = recommendations;
  if (isSearchMode && searchNdcs && searchNdcs.length > 0) {
    console.log(`\n=== FILTERING RECOMMENDATIONS ===`);
    console.log(`Total recommendations before filter:`, recommendations.length);
    console.log(`Recommendations NDCs:`, recommendations.map(r => r.ndc));
    
    // Normalize search NDCs for comparison (remove dashes)
    const normalizedSearchNdcs = searchNdcs.map(n => String(n).replace(/-/g, '').trim().toLowerCase());
    console.log(`Original search NDCs (from user):`, searchNdcs);
    console.log(`Normalized search NDCs (for filter):`, normalizedSearchNdcs);
    
    // Filter recommendations to only include those matching the search NDCs
    // Use exact matching after normalization to ensure we only return the specific NDCs requested
    filteredRecommendations = recommendations.filter(rec => {
      const normalizedRecNdc = String(rec.ndc).replace(/-/g, '').trim().toLowerCase();
      const matches = normalizedSearchNdcs.some(searchNdc => 
        normalizedRecNdc === searchNdc
      );
      console.log(`Checking rec.ndc="${rec.ndc}" (normalized="${normalizedRecNdc}") → ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
      return matches;
    });
    
    console.log(`Total recommendations after filter:`, filteredRecommendations.length);
    console.log(`=== END FILTERING ===\n`);
    
    // Recalculate totalPotentialSavings based on filtered recommendations
    const filteredTotalPotentialSavings = filteredRecommendations.reduce((sum, rec) => sum + rec.savings, 0);
    
    // Recalculate earnings comparison based on filtered recommendations
    const filteredAllDistributorNames = new Set<string>();
    filteredRecommendations.forEach((rec) => {
      filteredAllDistributorNames.add(rec.recommendedDistributor);
      rec.alternativeDistributors.forEach((alt) => {
        filteredAllDistributorNames.add(alt.name);
      });
    });

    const filteredDistributorTotalEarnings: Record<string, number> = {};
    
    for (const distributorName of filteredAllDistributorNames) {
      let totalEarnings = 0;
      
      filteredRecommendations.forEach((rec) => {
        let price: number | null = null;
        
        if (rec.recommendedDistributor === distributorName) {
          price = rec.expectedPrice;
        } else {
          const altDist = rec.alternativeDistributors.find(alt => alt.name === distributorName);
          if (altDist) {
            price = altDist.price;
          }
        }
        
        const finalPrice = price !== null ? price : rec.worstPrice;
        totalEarnings += finalPrice * rec.quantity;
      });
      
      filteredDistributorTotalEarnings[distributorName] = totalEarnings;
    }

    const filteredBestSingleDistributor = Object.entries(filteredDistributorTotalEarnings)
      .sort((a, b) => b[1] - a[1])[0];
    
    const filteredSingleDistributorStrategy = filteredBestSingleDistributor ? filteredBestSingleDistributor[1] : 0;

    let filteredMultipleDistributorsStrategy = 0;

    filteredRecommendations.forEach((rec) => {
      const allOptions = [
        { 
          name: rec.recommendedDistributor, 
          price: rec.expectedPrice, 
          stillAvailableThisMonth: distributorNameToStillAvailableMap[rec.recommendedDistributor] ?? false 
        },
        ...rec.alternativeDistributors.map((alt) => ({
          name: alt.name,
          price: alt.price,
          stillAvailableThisMonth: distributorNameToStillAvailableMap[alt.name] ?? false,
        })),
      ];

      const availableThisMonthOptions = allOptions
        .sort((a, b) => b.price - a.price);

      if (availableThisMonthOptions.length > 0) {
        const bestAvailable = availableThisMonthOptions[0];
        const earnings = bestAvailable.price * rec.quantity;
        filteredMultipleDistributorsStrategy += earnings;
      } else {
        const earnings = rec.expectedPrice * rec.quantity;
        filteredMultipleDistributorsStrategy += earnings;
      }
    });

    const filteredPotentialAdditionalEarnings = Math.max(0, filteredMultipleDistributorsStrategy - filteredSingleDistributorStrategy);

    return {
      recommendations: filteredRecommendations,
      totalPotentialSavings: filteredTotalPotentialSavings,
      generatedAt: new Date().toISOString(),
      distributorUsage: {
        usedThisMonth,
        totalDistributors,
        stillAvailable,
      },
      earningsComparison: {
        singleDistributorStrategy: Math.round(filteredSingleDistributorStrategy * 100) / 100,
        multipleDistributorsStrategy: Math.round(filteredMultipleDistributorsStrategy * 100) / 100,
        potentialAdditionalEarnings: Math.round(filteredPotentialAdditionalEarnings * 100) / 100,
      },
    };
  }

  return {
    recommendations,
    totalPotentialSavings,
    generatedAt: new Date().toISOString(),
    distributorUsage: {
      usedThisMonth,
      totalDistributors,
      stillAvailable,
    },
    earningsComparison: {
      singleDistributorStrategy: Math.round(singleDistributorStrategy * 100) / 100,
      multipleDistributorsStrategy: Math.round(multipleDistributorsStrategy * 100) / 100,
      potentialAdditionalEarnings: Math.round(potentialAdditionalEarnings * 100) / 100,
    },
  };
};

// Package Recommendation Interfaces
export interface PackageProduct {
  ndc: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
}

export interface DistributorPackage {
  distributorName: string;
  distributorId?: string;
  distributorContact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  products: PackageProduct[];
  totalItems: number;
  totalEstimatedValue: number;
  averagePricePerUnit: number;
}

export interface PackageRecommendationResponse {
  packages: DistributorPackage[];
  totalProducts: number;
  totalPackages: number;
  totalEstimatedValue: number;
  generatedAt: string;
  summary: {
    productsWithPricing: number;
    productsWithoutPricing: number;
    distributorsUsed: number;
  };
}

/**
 * Get package recommendations for pharmacy products
 * Groups products by distributor based on best prices
 */
export const getPackageRecommendations = async (
  pharmacyId: string
): Promise<PackageRecommendationResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Step 1: Get all product list items for this pharmacy
  const { data: productItems, error: itemsError } = await db
    .from('product_list_items')
    .select('id, ndc, product_name, quantity')
    .eq('added_by', pharmacyId);

  if (itemsError) {
    throw new AppError(`Failed to fetch product list items: ${itemsError.message}`, 400);
  }

  if (!productItems || productItems.length === 0) {
    return {
      packages: [],
      totalProducts: 0,
      totalPackages: 0,
      totalEstimatedValue: 0,
      generatedAt: new Date().toISOString(),
      summary: {
        productsWithPricing: 0,
        productsWithoutPricing: 0,
        distributorsUsed: 0,
      },
    };
  }

  // Step 2: Extract unique NDCs
  const ndcs = [...new Set(productItems.map((item) => item.ndc))];

  // Step 3: Get pricing data from return_reports
  // Join with uploaded_documents and reverse_distributors to get distributor name
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      uploaded_documents (
        reverse_distributor_id,
        reverse_distributors (
          id,
          name
        )
      )
    `);

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  // Step 4: Build pricing map (NDC -> Distributor -> Best Price)
  const ndcPricingMap: Record<
    string,
    Array<{
      distributorName: string;
      pricePerUnit: number;
      creditAmount: number;
      quantity: number;
    }>
  > = {};

  // Initialize map for all NDCs
  ndcs.forEach((ndc) => {
    ndcPricingMap[ndc] = [];
  });

  // Process return reports to extract pricing
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           data?.reverseDistributor || 
                           data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';

    if (!distributorName || distributorName === 'Unknown Distributor') {
      return;
    }

    let items: any[] = [];

    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) {
        items = data.items;
      } else if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        items = [data.items];
      } else if (data.ndcCode || data.ndc) {
        items = [data];
      }
    }

    items.forEach((item: any) => {
      const ndcCode = item.ndcCode || item.ndc;

      if (!ndcCode) {
        return;
      }

      // Normalize NDC for comparison
      const normalizedNdcCode = String(ndcCode).replace(/-/g, '').trim();

      // Find matching NDC from product list
      const matchingNdc = ndcs.find((n) => {
        const normalizedProductNdc = String(n).replace(/-/g, '').trim();
        return (
          normalizedProductNdc === normalizedNdcCode ||
          String(n).trim() === String(ndcCode).trim() ||
          normalizedProductNdc === String(ndcCode).replace(/-/g, '').trim()
        );
      });

      if (!matchingNdc) {
        return;
      }

      const quantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit =
        Number(item.pricePerUnit) || (quantity > 0 && creditAmount > 0 ? creditAmount / quantity : 0);

      if (pricePerUnit > 0) {
        ndcPricingMap[matchingNdc].push({
          distributorName,
          pricePerUnit,
          creditAmount,
          quantity,
        });
      }
    });
  });

  // Step 5: For each product, find the best distributor (highest price = best return value)
  const productDistributorMap: Record<
    string,
    {
      distributorName: string;
      pricePerUnit: number;
    }
  > = {};

  productItems.forEach((productItem) => {
    const ndc = productItem.ndc;
    const pricingData = ndcPricingMap[ndc] || [];

    if (pricingData.length === 0) {
      // No pricing data found for this NDC
      return;
    }

    // Group by distributor and get average price per unit
    const distributorPrices: Record<
      string,
      { totalPrice: number; count: number }
    > = {};

    pricingData.forEach((pricing) => {
      const distName = (pricing.distributorName || 'Unknown Distributor').trim();
      if (!distributorPrices[distName]) {
        distributorPrices[distName] = {
          totalPrice: 0,
          count: 0,
        };
      }
      distributorPrices[distName].totalPrice += pricing.pricePerUnit;
      distributorPrices[distName].count += 1;
    });

    // Calculate average price per distributor
    const distributorAverages: Array<{ name: string; price: number }> = Object.entries(
      distributorPrices
    )
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name: name.trim(),
        price: data.totalPrice / data.count, // Average price per unit
      }));

    if (distributorAverages.length === 0) {
      return;
    }

    // Sort by price (highest first = best return value)
    distributorAverages.sort((a, b) => b.price - a.price);

    // Use the best distributor (highest price)
    productDistributorMap[ndc] = {
      distributorName: distributorAverages[0].name,
      pricePerUnit: distributorAverages[0].price,
    };
  });

  // Step 6: Group products by distributor
  const distributorPackagesMap: Record<string, PackageProduct[]> = {};

  productItems.forEach((productItem) => {
    const ndc = productItem.ndc;
    const distributorInfo = productDistributorMap[ndc];

    if (!distributorInfo) {
      // No pricing data for this product - skip it
      return;
    }

    const quantity = productItem.quantity || 1;
    const pricePerUnit = distributorInfo.pricePerUnit;
    const totalValue = pricePerUnit * quantity;

    if (!distributorPackagesMap[distributorInfo.distributorName]) {
      distributorPackagesMap[distributorInfo.distributorName] = [];
    }

    distributorPackagesMap[distributorInfo.distributorName].push({
      ndc,
      productName: productItem.product_name || `Product ${ndc}`,
      quantity,
      pricePerUnit,
      totalValue,
    });
  });

  // Step 7: Fetch distributor contact information
  const distributorNames = Object.keys(distributorPackagesMap);
  const distributorNameToIdMap: Record<string, string> = {};
  const distributorContactInfoMap: Record<string, {
    email?: string;
    phone?: string;
    location?: string;
  }> = {};

  if (distributorNames.length > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('name', distributorNames);

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        distributorNameToIdMap[dist.name] = dist.id;

        // Format location from address
        let location: string | undefined;
        if (dist.address) {
          const addr = dist.address;
          const locationParts: string[] = [];

          if (addr.street) locationParts.push(addr.street);
          if (addr.city) locationParts.push(addr.city);
          if (addr.state) locationParts.push(addr.state);
          if (addr.zipCode) locationParts.push(addr.zipCode);
          if (addr.country) locationParts.push(addr.country);

          if (locationParts.length > 0) {
            location = locationParts.join(', ');
          }
        }

        distributorContactInfoMap[dist.name] = {
          email: dist.contact_email || undefined,
          phone: dist.contact_phone || undefined,
          location,
        };
      });
    }
  }

  // Step 8: Build package recommendations
  const packages: DistributorPackage[] = Object.entries(distributorPackagesMap).map(
    ([distributorName, products]) => {
      const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
      const totalEstimatedValue = products.reduce((sum, p) => sum + p.totalValue, 0);
      const averagePricePerUnit = totalItems > 0 ? totalEstimatedValue / totalItems : 0;

      return {
        distributorName,
        distributorId: distributorNameToIdMap[distributorName],
        distributorContact: distributorContactInfoMap[distributorName],
        products,
        totalItems,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
        averagePricePerUnit: Math.round(averagePricePerUnit * 100) / 100,
      };
    }
  );

  // Sort packages by total estimated value (highest first)
  packages.sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue);

  // Calculate summary statistics
  const productsWithPricing = Object.keys(productDistributorMap).length;
  const productsWithoutPricing = productItems.length - productsWithPricing;
  const totalEstimatedValue = packages.reduce((sum, pkg) => sum + pkg.totalEstimatedValue, 0);

  return {
    packages,
    totalProducts: productItems.length,
    totalPackages: packages.length,
    totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
    generatedAt: new Date().toISOString(),
    summary: {
      productsWithPricing,
      productsWithoutPricing,
      distributorsUsed: packages.length,
    },
  };
};

// Get package recommendations by NDC codes
export const getPackageRecommendationsByNdcs = async (
  ndcs: string[]
): Promise<PackageRecommendationResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  if (!ndcs || ndcs.length === 0) {
    return {
      packages: [],
      totalProducts: 0,
      totalPackages: 0,
      totalEstimatedValue: 0,
      generatedAt: new Date().toISOString(),
      summary: {
        productsWithPricing: 0,
        productsWithoutPricing: 0,
        distributorsUsed: 0,
      },
    };
  }

  // Step 1: Normalize and deduplicate NDCs
  const normalizedNdcs = [...new Set(ndcs.map((ndc) => ndc.trim()).filter((ndc) => ndc.length > 0))];

  if (normalizedNdcs.length === 0) {
    return {
      packages: [],
      totalProducts: 0,
      totalPackages: 0,
      totalEstimatedValue: 0,
      generatedAt: new Date().toISOString(),
      summary: {
        productsWithPricing: 0,
        productsWithoutPricing: 0,
        distributorsUsed: 0,
      },
    };
  }

  // Step 2: Get product information from products table
  const { data: products, error: productsError } = await db
    .from('products')
    .select('ndc, product_name')
    .in('ndc', normalizedNdcs);

  // Create a map of NDC to product name
  const ndcToProductNameMap: Record<string, string> = {};
  if (!productsError && products) {
    products.forEach((product) => {
      ndcToProductNameMap[product.ndc] = product.product_name;
    });
  }

  // Step 3: Get pricing data from return_reports
  // Join with uploaded_documents and reverse_distributors to get distributor name
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      uploaded_documents (
        reverse_distributor_id,
        reverse_distributors (
          id,
          name
        )
      )
    `);

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  // Step 4: Build pricing map (NDC -> Distributor -> Best Price)
  const ndcPricingMap: Record<
    string,
    Array<{
      distributorName: string;
      pricePerUnit: number;
      creditAmount: number;
      quantity: number;
    }>
  > = {};

  // Initialize map for all NDCs
  normalizedNdcs.forEach((ndc) => {
    ndcPricingMap[ndc] = [];
  });

  // Process return reports to extract pricing
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           data?.reverseDistributor || 
                           data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';

    if (!distributorName || distributorName === 'Unknown Distributor') {
      return;
    }

    let items: any[] = [];

    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) {
        items = data.items;
      } else if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        items = [data.items];
      } else if (data.ndcCode || data.ndc) {
        items = [data];
      }
    }

    items.forEach((item: any) => {
      const ndcCode = item.ndcCode || item.ndc;

      if (!ndcCode) {
        return;
      }

      // Normalize NDC for comparison
      const normalizedNdcCode = String(ndcCode).replace(/-/g, '').trim();

      // Find matching NDC from provided list
      const matchingNdc = normalizedNdcs.find((n) => {
        const normalizedProductNdc = String(n).replace(/-/g, '').trim();
        return (
          normalizedProductNdc === normalizedNdcCode ||
          String(n).trim() === String(ndcCode).trim() ||
          normalizedProductNdc === String(ndcCode).replace(/-/g, '').trim()
        );
      });

      if (!matchingNdc) {
        return;
      }

      const quantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit =
        Number(item.pricePerUnit) || (quantity > 0 && creditAmount > 0 ? creditAmount / quantity : 0);

      if (pricePerUnit > 0) {
        ndcPricingMap[matchingNdc].push({
          distributorName,
          pricePerUnit,
          creditAmount,
          quantity,
        });
      }
    });
  });

  // Step 5: For each NDC, find the best distributor (highest price = best return value)
  const ndcDistributorMap: Record<
    string,
    {
      distributorName: string;
      pricePerUnit: number;
    }
  > = {};

  normalizedNdcs.forEach((ndc) => {
    const pricingData = ndcPricingMap[ndc] || [];

    if (pricingData.length === 0) {
      // No pricing data found for this NDC
      return;
    }

    // Group by distributor and get average price per unit
    const distributorPrices: Record<
      string,
      { totalPrice: number; count: number }
    > = {};

    pricingData.forEach((pricing) => {
      const distName = (pricing.distributorName || 'Unknown Distributor').trim();
      if (!distributorPrices[distName]) {
        distributorPrices[distName] = {
          totalPrice: 0,
          count: 0,
        };
      }
      distributorPrices[distName].totalPrice += pricing.pricePerUnit;
      distributorPrices[distName].count += 1;
    });

    // Calculate average price per distributor
    const distributorAverages: Array<{ name: string; price: number }> = Object.entries(
      distributorPrices
    )
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name: name.trim(),
        price: data.totalPrice / data.count, // Average price per unit
      }));

    if (distributorAverages.length === 0) {
      return;
    }

    // Sort by price (highest first = best return value)
    distributorAverages.sort((a, b) => b.price - a.price);

    // Use the best distributor (highest price)
    ndcDistributorMap[ndc] = {
      distributorName: distributorAverages[0].name,
      pricePerUnit: distributorAverages[0].price,
    };
  });

  // Step 6: Group NDCs by distributor (default quantity to 1 for each NDC)
  const distributorPackagesMap: Record<string, PackageProduct[]> = {};

  normalizedNdcs.forEach((ndc) => {
    const distributorInfo = ndcDistributorMap[ndc];

    if (!distributorInfo) {
      // No pricing data for this NDC - skip it
      return;
    }

    const quantity = 1; // Default quantity, can be extended to accept quantities per NDC
    const pricePerUnit = distributorInfo.pricePerUnit;
    const totalValue = pricePerUnit * quantity;
    const productName = ndcToProductNameMap[ndc] || `Product ${ndc}`;

    if (!distributorPackagesMap[distributorInfo.distributorName]) {
      distributorPackagesMap[distributorInfo.distributorName] = [];
    }

    distributorPackagesMap[distributorInfo.distributorName].push({
      ndc,
      productName,
      quantity,
      pricePerUnit,
      totalValue,
    });
  });

  // Step 7: Fetch distributor contact information
  const distributorNames = Object.keys(distributorPackagesMap);
  const distributorNameToIdMap: Record<string, string> = {};
  const distributorContactInfoMap: Record<string, {
    email?: string;
    phone?: string;
    location?: string;
  }> = {};

  if (distributorNames.length > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('name', distributorNames);

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        distributorNameToIdMap[dist.name] = dist.id;

        // Format location from address
        let location: string | undefined;
        if (dist.address) {
          const addr = dist.address;
          const locationParts: string[] = [];

          if (addr.street) locationParts.push(addr.street);
          if (addr.city) locationParts.push(addr.city);
          if (addr.state) locationParts.push(addr.state);
          if (addr.zipCode) locationParts.push(addr.zipCode);
          if (addr.country) locationParts.push(addr.country);

          if (locationParts.length > 0) {
            location = locationParts.join(', ');
          }
        }

        distributorContactInfoMap[dist.name] = {
          email: dist.contact_email || undefined,
          phone: dist.contact_phone || undefined,
          location,
        };
      });
    }
  }

  // Step 8: Build package recommendations
  const packages: DistributorPackage[] = Object.entries(distributorPackagesMap).map(
    ([distributorName, products]) => {
      const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
      const totalEstimatedValue = products.reduce((sum, p) => sum + p.totalValue, 0);
      const averagePricePerUnit = totalItems > 0 ? totalEstimatedValue / totalItems : 0;

      return {
        distributorName,
        distributorId: distributorNameToIdMap[distributorName],
        distributorContact: distributorContactInfoMap[distributorName],
        products,
        totalItems,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
        averagePricePerUnit: Math.round(averagePricePerUnit * 100) / 100,
      };
    }
  );

  // Sort packages by total estimated value (highest first)
  packages.sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue);

  // Calculate summary statistics
  const productsWithPricing = Object.keys(ndcDistributorMap).length;
  const productsWithoutPricing = normalizedNdcs.length - productsWithPricing;
  const totalEstimatedValue = packages.reduce((sum, pkg) => sum + pkg.totalEstimatedValue, 0);

  return {
    packages,
    totalProducts: normalizedNdcs.length,
    totalPackages: packages.length,
    totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
    generatedAt: new Date().toISOString(),
    summary: {
      productsWithPricing,
      productsWithoutPricing,
      distributorsUsed: packages.length,
    },
  };
};

// Interface for distributor suggestion
export interface DistributorSuggestion {
  distributorName: string;
  distributorId?: string;
  distributorContact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  pricePerUnit: number;
  totalEstimatedValue: number;
  averagePricePerUnit: number;
  available: boolean;
}

export interface NdcSuggestionResponse {
  ndc: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  hasEnoughQuantity: boolean;
  distributors: DistributorSuggestion[];
  generatedAt: string;
}

// Get distributor suggestions for a specific NDC and quantity
export const getDistributorSuggestionsByNdc = async (
  pharmacyId: string,
  ndc: string,
  quantity: number,
  productName?: string
): Promise<NdcSuggestionResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Normalize NDC
  const normalizedNdc = ndc.trim();
  const normalizedNdcForSearch = normalizedNdc.replace(/-/g, '').trim();

  // Step 1: Check if pharmacy has the required quantity in product_list_items
  const { data: productItems, error: itemsError } = await db
    .from('product_list_items')
    .select('ndc, quantity')
    .eq('added_by', pharmacyId);

  if (itemsError) {
    throw new AppError(`Failed to fetch product list items: ${itemsError.message}`, 400);
  }

  // Calculate total available quantity for this NDC
  let availableQuantity = 0;
  if (productItems && productItems.length > 0) {
    productItems.forEach((item) => {
      const itemNdc = String(item.ndc).trim();
      const normalizedItemNdc = String(item.ndc).replace(/-/g, '').trim();
      
      // Match NDC (with or without dashes)
      if (
        itemNdc === normalizedNdc ||
        normalizedItemNdc === normalizedNdcForSearch ||
        itemNdc === normalizedNdcForSearch ||
        normalizedItemNdc === normalizedNdc
      ) {
        availableQuantity += item.quantity || 0;
      }
    });
  }

  const hasEnoughQuantity = availableQuantity >= quantity;

  // If pharmacy doesn't have enough quantity, return error immediately
  if (!hasEnoughQuantity) {
    // Get product name for error message
    let finalProductName = productName;
    if (!finalProductName) {
      // Try to get from products table
      const { data: product, error: productError } = await db
        .from('products')
        .select('product_name')
        .eq('ndc', normalizedNdc)
        .limit(1)
        .maybeSingle();

      if (!productError && product?.product_name) {
        finalProductName = product.product_name;
      } else {
        // Try to get from product_list_items
        const { data: productItems, error: itemsError } = await db
          .from('product_list_items')
          .select('product_name')
          .eq('added_by', pharmacyId)
          .or(`ndc.eq.${normalizedNdc},ndc.eq.${normalizedNdcForSearch}`)
          .limit(1);

        if (!itemsError && productItems && productItems.length > 0 && productItems[0]?.product_name) {
          finalProductName = productItems[0].product_name;
        } else {
          finalProductName = `Product ${normalizedNdc}`;
        }
      }
    }

    if (availableQuantity === 0) {
      throw new AppError(
        `You don't have this product in your inventory. NDC: ${normalizedNdc}, Product: ${finalProductName}`,
        400
      );
    } else {
      throw new AppError(
        `You don't have enough quantity for this product. NDC: ${normalizedNdc}, Product: ${finalProductName}, Available: ${availableQuantity}, Requested: ${quantity}`,
        400
      );
    }
  }

  // Step 2: Get product name if not provided
  let finalProductName = productName;
  if (!finalProductName) {
    // Try to get from products table
    const { data: product, error: productError } = await db
      .from('products')
      .select('product_name')
      .eq('ndc', normalizedNdc)
      .limit(1)
      .maybeSingle();

    if (!productError && product?.product_name) {
      finalProductName = product.product_name;
    } else {
      // Try to get from product_list_items
      const { data: productItems, error: itemsError } = await db
        .from('product_list_items')
        .select('product_name')
        .eq('added_by', pharmacyId)
        .or(`ndc.eq.${normalizedNdc},ndc.eq.${normalizedNdcForSearch}`)
        .limit(1);

      if (!itemsError && productItems && productItems.length > 0 && productItems[0]?.product_name) {
        finalProductName = productItems[0].product_name;
      } else {
        finalProductName = `Product ${normalizedNdc}`;
      }
    }
  }

  // Step 3: Get pricing data from return_reports
  // Join with uploaded_documents and reverse_distributors to get distributor name
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      uploaded_documents (
        reverse_distributor_id,
        reverse_distributors (
          id,
          name
        )
      )
    `);

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  // Step 4: Build pricing map for this NDC
  const distributorPricingMap: Record<
    string,
    Array<{
      pricePerUnit: number;
      creditAmount: number;
      quantity: number;
    }>
  > = {};

  // Process return reports to extract pricing for this NDC
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           data?.reverseDistributor || 
                           data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';

    if (!distributorName || distributorName === 'Unknown Distributor') {
      return;
    }

    let items: any[] = [];

    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) {
        items = data.items;
      } else if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        items = [data.items];
      } else if (data.ndcCode || data.ndc) {
        items = [data];
      }
    }

    items.forEach((item: any) => {
      const ndcCode = item.ndcCode || item.ndc;

      if (!ndcCode) {
        return;
      }

      // Normalize NDC for comparison
      const normalizedItemNdc = String(ndcCode).replace(/-/g, '').trim();
      const itemNdc = String(ndcCode).trim();

      // Check if this item matches our NDC
      const isMatch =
        itemNdc === normalizedNdc ||
        normalizedItemNdc === normalizedNdcForSearch ||
        itemNdc === normalizedNdcForSearch ||
        normalizedItemNdc === normalizedNdc;

      if (!isMatch) {
        return;
      }

      const itemQuantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit =
        Number(item.pricePerUnit) || (itemQuantity > 0 && creditAmount > 0 ? creditAmount / itemQuantity : 0);

      if (pricePerUnit > 0) {
        if (!distributorPricingMap[distributorName]) {
          distributorPricingMap[distributorName] = [];
        }

        distributorPricingMap[distributorName].push({
          pricePerUnit,
          creditAmount,
          quantity: itemQuantity,
        });
      }
    });
  });

  // Step 5: Calculate average price per unit for each distributor
  const distributorAverages: Array<{
    name: string;
    averagePricePerUnit: number;
    totalPrice: number;
    count: number;
  }> = [];

  Object.entries(distributorPricingMap).forEach(([distributorName, pricingData]) => {
    const totalPrice = pricingData.reduce((sum, p) => sum + p.pricePerUnit, 0);
    const count = pricingData.length;
    const averagePricePerUnit = count > 0 ? totalPrice / count : 0;

    if (averagePricePerUnit > 0) {
      distributorAverages.push({
        name: distributorName.trim(),
        averagePricePerUnit,
        totalPrice,
        count,
      });
    }
  });

  // Sort by average price (highest first = best return value)
  distributorAverages.sort((a, b) => b.averagePricePerUnit - a.averagePricePerUnit);

  // Step 6: Fetch distributor contact information
  const distributorNames = distributorAverages.map((d) => d.name);
  const distributorNameToIdMap: Record<string, string> = {};
  const distributorContactInfoMap: Record<string, {
    email?: string;
    phone?: string;
    location?: string;
  }> = {};

  if (distributorNames.length > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('name', distributorNames);

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        distributorNameToIdMap[dist.name] = dist.id;

        // Format location from address
        let location: string | undefined;
        if (dist.address) {
          const addr = dist.address;
          const locationParts: string[] = [];

          if (addr.street) locationParts.push(addr.street);
          if (addr.city) locationParts.push(addr.city);
          if (addr.state) locationParts.push(addr.state);
          if (addr.zipCode) locationParts.push(addr.zipCode);
          if (addr.country) locationParts.push(addr.country);

          if (locationParts.length > 0) {
            location = locationParts.join(', ');
          }
        }

        distributorContactInfoMap[dist.name] = {
          email: dist.contact_email || undefined,
          phone: dist.contact_phone || undefined,
          location,
        };
      });
    }
  }

  // Step 7: Build distributor suggestions
  const distributors: DistributorSuggestion[] = distributorAverages.map((dist) => {
    const totalEstimatedValue = dist.averagePricePerUnit * quantity;

    return {
      distributorName: dist.name,
      distributorId: distributorNameToIdMap[dist.name],
      distributorContact: distributorContactInfoMap[dist.name],
      pricePerUnit: Math.round(dist.averagePricePerUnit * 100) / 100,
      totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
      averagePricePerUnit: Math.round(dist.averagePricePerUnit * 100) / 100,
      available: true, // Assuming available if found in return reports
    };
  });

  return {
    ndc: normalizedNdc,
    productName: finalProductName || `Product ${normalizedNdc}`,
    requestedQuantity: quantity,
    availableQuantity,
    hasEnoughQuantity,
    distributors,
    generatedAt: new Date().toISOString(),
  };
};

// Interface for multiple NDC suggestions request item
export interface NdcSuggestionRequestItem {
  ndc: string;
  product?: string;
  quantity: number;
}

// Interface for distributor NDC product info
export interface DistributorNdcProduct {
  ndc: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalEstimatedValue: number;
}

// Interface for distributor with their accepted NDCs
export interface DistributorWithNdcs {
  distributorName: string;
  distributorId?: string;
  distributorContact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  products: DistributorNdcProduct[];
  totalItems: number;
  totalEstimatedValue: number;
  ndcsCount: number;
}

// Interface for NDC without any distributor
export interface NdcWithoutDistributor {
  ndc: string;
  productName: string;
  quantity: number;
  reason: string;
}

// Interface for multiple NDC suggestions response (grouped by distributor)
export interface MultipleNdcSuggestionResponse {
  distributors: DistributorWithNdcs[];
  ndcsWithoutDistributors: NdcWithoutDistributor[];
  totalItems: number;
  totalDistributors: number;
  totalEstimatedValue: number;
  generatedAt: string;
}

// Get distributor suggestions for multiple NDCs and quantities (grouped by distributor)
export const getDistributorSuggestionsByMultipleNdcs = async (
  pharmacyId: string,
  items: NdcSuggestionRequestItem[]
): Promise<MultipleNdcSuggestionResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  if (!items || items.length === 0) {
    throw new AppError('At least one item with NDC and quantity is required', 400);
  }

  const db = supabaseAdmin;

  // Step 1: Validate quantities for all items first
  const { data: productItems, error: itemsError } = await db
    .from('product_list_items')
    .select('ndc, quantity, product_name')
    .eq('added_by', pharmacyId);

  if (itemsError) {
    throw new AppError(`Failed to fetch product list items: ${itemsError.message}`, 400);
  }

  // Validate each item has enough quantity
  for (const item of items) {
    const normalizedNdc = item.ndc.trim();
    const normalizedNdcForSearch = normalizedNdc.replace(/-/g, '').trim();
    
    let availableQuantity = 0;
    if (productItems && productItems.length > 0) {
      productItems.forEach((pItem) => {
        const itemNdc = String(pItem.ndc).trim();
        const normalizedItemNdc = String(pItem.ndc).replace(/-/g, '').trim();
        
        if (
          itemNdc === normalizedNdc ||
          normalizedItemNdc === normalizedNdcForSearch ||
          itemNdc === normalizedNdcForSearch ||
          normalizedItemNdc === normalizedNdc
        ) {
          availableQuantity += pItem.quantity || 0;
        }
      });
    }

    if (availableQuantity < item.quantity) {
      // Get product name for error
      let productName = item.product || `Product ${normalizedNdc}`;
      if (!item.product) {
        const { data: product } = await db
          .from('products')
          .select('product_name')
          .eq('ndc', normalizedNdc)
          .limit(1)
          .maybeSingle();

        if (product?.product_name) {
          productName = product.product_name;
        } else {
          const matchingItem = productItems?.find((pItem) => {
            const itemNdc = String(pItem.ndc).trim();
            const normalizedItemNdc = String(pItem.ndc).replace(/-/g, '').trim();
            return (
              itemNdc === normalizedNdc ||
              normalizedItemNdc === normalizedNdcForSearch ||
              itemNdc === normalizedNdcForSearch ||
              normalizedItemNdc === normalizedNdc
            );
          });
          if (matchingItem?.product_name) {
            productName = matchingItem.product_name;
          }
        }
      }

      if (availableQuantity === 0) {
        throw new AppError(
          `You don't have this product in your inventory. NDC: ${normalizedNdc}, Product: ${productName}`,
          400
        );
      } else {
        throw new AppError(
          `You don't have enough quantity for this product. NDC: ${normalizedNdc}, Product: ${productName}, Available: ${availableQuantity}, Requested: ${item.quantity}`,
          400
        );
      }
    }
  }

  // Step 2: Get all return reports
  // Join with uploaded_documents and reverse_distributors to get distributor name
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      uploaded_documents!inner(
        reverse_distributor_id,
        reverse_distributors!inner(
          id,
          name
        )
      )
    `);

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  // Step 3: Build pricing map for all NDCs (NDC -> Distributor -> Pricing Data)
  const ndcDistributorPricingMap: Record<
    string,
    Record<
      string,
      Array<{
        pricePerUnit: number;
        creditAmount: number;
        quantity: number;
      }>
    >
  > = {};

  // Initialize map for all NDCs
  items.forEach((item) => {
    const normalizedNdc = item.ndc.trim();
    ndcDistributorPricingMap[normalizedNdc] = {};
  });

  // Process return reports to extract pricing for all NDCs
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    // Get distributor name from joined reverse_distributors table, fallback to data field, then Unknown
    const distributorName = report.uploaded_documents?.reverse_distributors?.name || 
                           data?.reverseDistributor || 
                           data?.reverseDistributorInfo?.name ||
                           'Unknown Distributor';

    if (!distributorName || distributorName === 'Unknown Distributor') {
      return;
    }

    let reportItems: any[] = [];

    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) {
        reportItems = data.items;
      } else if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        reportItems = [data.items];
      } else if (data.ndcCode || data.ndc) {
        reportItems = [data];
      }
    }

    reportItems.forEach((item: any) => {
      const ndcCode = item.ndcCode || item.ndc;
      if (!ndcCode) {
        return;
      }

      const normalizedItemNdc = String(ndcCode).replace(/-/g, '').trim();
      const itemNdc = String(ndcCode).trim();

      // Find matching NDC from requested items
      let matchingNdc: string | undefined;
      for (const requestedItem of items) {
        const normalizedRequestedNdc = requestedItem.ndc.trim();
        const normalizedRequestedNdcForSearch = normalizedRequestedNdc.replace(/-/g, '').trim();

        if (
          itemNdc === normalizedRequestedNdc ||
          normalizedItemNdc === normalizedRequestedNdcForSearch ||
          itemNdc === normalizedRequestedNdcForSearch ||
          normalizedItemNdc === normalizedRequestedNdc
        ) {
          matchingNdc = normalizedRequestedNdc;
          break;
        }
      }

      if (!matchingNdc) {
        return;
      }

      const itemQuantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit =
        Number(item.pricePerUnit) || (itemQuantity > 0 && creditAmount > 0 ? creditAmount / itemQuantity : 0);

      if (pricePerUnit > 0) {
        if (!ndcDistributorPricingMap[matchingNdc][distributorName]) {
          ndcDistributorPricingMap[matchingNdc][distributorName] = [];
        }

        ndcDistributorPricingMap[matchingNdc][distributorName].push({
          pricePerUnit,
          creditAmount,
          quantity: itemQuantity,
        });
      }
    });
  });

  // Step 4: Calculate average price per distributor for each NDC
  const ndcDistributorAverages: Record<
    string,
    Array<{
      distributorName: string;
      averagePricePerUnit: number;
    }>
  > = {};

  items.forEach((item) => {
    const normalizedNdc = item.ndc.trim();
    const distributorPricing = ndcDistributorPricingMap[normalizedNdc] || {};
    const averages: Array<{ distributorName: string; averagePricePerUnit: number }> = [];

    Object.entries(distributorPricing).forEach(([distributorName, pricingData]) => {
      const totalPrice = pricingData.reduce((sum, p) => sum + p.pricePerUnit, 0);
      const count = pricingData.length;
      const averagePricePerUnit = count > 0 ? totalPrice / count : 0;

      if (averagePricePerUnit > 0) {
        averages.push({
          distributorName: distributorName.trim(),
          averagePricePerUnit,
        });
      }
    });

    // Sort by price (highest first)
    averages.sort((a, b) => b.averagePricePerUnit - a.averagePricePerUnit);
    ndcDistributorAverages[normalizedNdc] = averages;
  });

  // Step 5: Get product names for all NDCs
  const ndcProductNames: Record<string, string> = {};
  for (const item of items) {
    const normalizedNdc = item.ndc.trim();
    let productName: string = item.product || '';

    if (!productName) {
      const { data: product } = await db
        .from('products')
        .select('product_name')
        .eq('ndc', normalizedNdc)
        .limit(1)
        .maybeSingle();

      if (product?.product_name) {
        productName = product.product_name;
      } else {
        const matchingItem = productItems?.find((pItem) => {
          const itemNdc = String(pItem.ndc).trim();
          const normalizedItemNdc = String(pItem.ndc).replace(/-/g, '').trim();
          const normalizedNdcForSearch = normalizedNdc.replace(/-/g, '').trim();
          return (
            itemNdc === normalizedNdc ||
            normalizedItemNdc === normalizedNdcForSearch ||
            itemNdc === normalizedNdcForSearch ||
            normalizedItemNdc === normalizedNdc
          );
        });
        if (matchingItem?.product_name) {
          productName = matchingItem.product_name;
        } else {
          productName = `Product ${normalizedNdc}`;
        }
      }
    }

    ndcProductNames[normalizedNdc] = productName;
  }

  // Step 6: Group by distributor
  const distributorMap: Record<string, DistributorWithNdcs> = {};
  const ndcsWithDistributors = new Set<string>();

  items.forEach((item) => {
    const normalizedNdc = item.ndc.trim();
    const distributorAverages = ndcDistributorAverages[normalizedNdc] || [];

    if (distributorAverages.length === 0) {
      // This NDC has no distributors - will be added to ndcsWithoutDistributors later
      return;
    }

    ndcsWithDistributors.add(normalizedNdc);

    // Add this NDC to all distributors that accept it
    distributorAverages.forEach((dist) => {
      const distributorName = dist.distributorName;

      if (!distributorMap[distributorName]) {
        distributorMap[distributorName] = {
          distributorName,
          products: [],
          totalItems: 0,
          totalEstimatedValue: 0,
          ndcsCount: 0,
        };
      }

      const pricePerUnit = dist.averagePricePerUnit;
      const totalEstimatedValue = pricePerUnit * item.quantity;

      distributorMap[distributorName].products.push({
        ndc: normalizedNdc,
        productName: ndcProductNames[normalizedNdc],
        quantity: item.quantity,
        pricePerUnit: Math.round(pricePerUnit * 100) / 100,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
      });

      distributorMap[distributorName].totalItems += item.quantity;
      distributorMap[distributorName].totalEstimatedValue += totalEstimatedValue;
      distributorMap[distributorName].ndcsCount += 1;
    });
  });

  // Step 7: Fetch distributor contact information
  const distributorNames = Object.keys(distributorMap);
  if (distributorNames.length > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('name', distributorNames);

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        if (distributorMap[dist.name]) {
          distributorMap[dist.name].distributorId = dist.id;

          // Format location from address
          let location: string | undefined;
          if (dist.address) {
            const addr = dist.address;
            const locationParts: string[] = [];

            if (addr.street) locationParts.push(addr.street);
            if (addr.city) locationParts.push(addr.city);
            if (addr.state) locationParts.push(addr.state);
            if (addr.zipCode) locationParts.push(addr.zipCode);
            if (addr.country) locationParts.push(addr.country);

            if (locationParts.length > 0) {
              location = locationParts.join(', ');
            }
          }

          distributorMap[dist.name].distributorContact = {
            email: dist.contact_email || undefined,
            phone: dist.contact_phone || undefined,
            location,
          };
        }
      });
    }
  }

  // Step 8: Build distributors array and calculate totals
  const distributorsArray: DistributorWithNdcs[] = Object.values(distributorMap).map((dist) => ({
    ...dist,
    totalEstimatedValue: Math.round(dist.totalEstimatedValue * 100) / 100,
  }));

  // Sort by total estimated value (highest first)
  distributorsArray.sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue);

  // Step 9: Find NDCs without any distributors
  const ndcsWithoutDistributors: NdcWithoutDistributor[] = [];
  items.forEach((item) => {
    const normalizedNdc = item.ndc.trim();
    if (!ndcsWithDistributors.has(normalizedNdc)) {
      ndcsWithoutDistributors.push({
        ndc: normalizedNdc,
        productName: ndcProductNames[normalizedNdc],
        quantity: item.quantity,
        reason: 'No distributor found offering returns for this NDC',
      });
    }
  });

  // Calculate total estimated value
  const totalEstimatedValue = distributorsArray.reduce((sum, dist) => sum + dist.totalEstimatedValue, 0);

  return {
    distributors: distributorsArray,
    ndcsWithoutDistributors,
    totalItems: items.length,
    totalDistributors: distributorsArray.length,
    totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
    generatedAt: new Date().toISOString(),
  };
};

