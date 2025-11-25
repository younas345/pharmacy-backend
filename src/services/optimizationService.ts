import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface OptimizationRecommendation {
  ndc: string;
  productName: string;
  quantity: number;
  recommendedDistributor: string;
  expectedPrice: number;
  worstPrice: number;
  available?: boolean;
  alternativeDistributors: Array<{
    name: string;
    price: number;
    difference: number;
    available?: boolean;
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
  let productItems: Array<{ id: string; ndc: string; product_name: string; quantity: number }> = [];
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
      .select('id, ndc, product_name, quantity')
      .eq('added_by', pharmacyId);
    
    // Create a map of found products for reference
    const productMap = new Map(
      (foundProducts || []).map(p => [String(p.ndc).replace(/-/g, '').trim(), p])
    );
    
    // Initialize product items with search terms (will be updated with actual matches later)
    productItems = searchTerms.map(searchTerm => {
      // Try to find exact match first
      const found = productMap.get(searchTerm);
      return found || {
        id: '',
        ndc: searchTerm,
        product_name: `Product ${searchTerm}`, // Default name, will be updated if match found
        quantity: 1, // Default quantity
      };
    });
  } else {
    // Step 1: Get all product list items for this pharmacy
    const { data: items, error: itemsError } = await db
      .from('product_list_items')
      .select('id, ndc, product_name, quantity')
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
  // Get distributor name directly from return_reports data
  const { data: returnReports, error: reportsError } = await db
    .from('return_reports')
    .select('id, data');

  if (reportsError) {
    throw new AppError(`Failed to fetch return reports: ${reportsError.message}`, 400);
  }

  console.log(`📦 Found ${returnReports?.length || 0} return report records`);
  console.log(`🔍 Looking for NDCs:`, ndcs);
  
  // Debug: Check what distributors we have in the data
  const allDistributors = new Set<string>();
  (returnReports || []).forEach((report: any) => {
    const distributorName = report.data?.reverseDistributor || 'Unknown Distributor';
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

  // Initialize map for all NDCs
  ndcs.forEach((ndc) => {
    ndcPricingMap[ndc] = [];
  });

  // Process return reports
  // Each return_reports record contains a single item in the data field
  (returnReports || []).forEach((report: any) => {
    const data = report.data;
    
    // Get distributor name directly from the data field
    const distributorName = data?.reverseDistributor || 'Unknown Distributor';
    
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
        return;
      }

      // Normalize NDC for comparison (remove dashes and convert to string)
      const normalizedNdcCode = String(ndcCode).replace(/-/g, '').trim();
      
      // Find matching NDC from product list or search terms
      let matchingNdc: string | undefined;
      let actualNdcKey: string; // The key to use in ndcPricingMap
      
      if (isSearchMode) {
        // Partial match mode: check if search term is contained in NDC or vice versa
        const matchedSearchTerm = ndcs.find(searchTerm => {
          const normalizedSearchTerm = String(searchTerm).replace(/-/g, '').trim();
          // Check if search term matches the beginning of NDC (LIKE logic)
          // e.g., "42385" should match "42385097801"
          return normalizedNdcCode.startsWith(normalizedSearchTerm) || 
                 normalizedSearchTerm.startsWith(normalizedNdcCode) ||
                 normalizedNdcCode === normalizedSearchTerm;
        });
        
        if (!matchedSearchTerm) {
          return;
        }
        
        // Use the actual NDC from return_reports as the key (not the search term)
        actualNdcKey = normalizedNdcCode;
        matchingNdc = matchedSearchTerm;
        
        // Track which search term matched this actual NDC
        searchTermToActualNdc[matchedSearchTerm] = normalizedNdcCode;
        
        // Initialize map entry for actual NDC if not exists
        if (!ndcPricingMap[actualNdcKey]) {
          ndcPricingMap[actualNdcKey] = [];
        }
      } else {
        // Exact match mode: original logic
        matchingNdc = ndcs.find(n => {
          const normalizedProductNdc = String(n).replace(/-/g, '').trim();
          return normalizedProductNdc === normalizedNdcCode || 
                 String(n).trim() === String(ndcCode).trim() ||
                 normalizedProductNdc === String(ndcCode).replace(/-/g, '').trim();
        });
        
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
    // Create a map of actual NDCs to product info
    const actualNdcToProduct: Map<string, { product_name: string; quantity: number }> = new Map();
    
    productItems.forEach(item => {
      const actualNdc = searchTermToActualNdc[item.ndc];
      if (actualNdc) {
        // Use actual NDC, keep product info
        if (!actualNdcToProduct.has(actualNdc)) {
          actualNdcToProduct.set(actualNdc, {
            product_name: item.product_name === `Product ${item.ndc}` 
              ? `Product ${actualNdc}` 
              : item.product_name,
            quantity: item.quantity
          });
        }
      }
    });
    
    // Update productItems with actual NDCs
    productItems = Array.from(actualNdcToProduct.entries()).map(([ndc, info]) => ({
      id: '',
      ndc,
      product_name: info.product_name,
      quantity: info.quantity
    }));
    
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
      ndc,
      productName: productItem.product_name || `Product ${ndc}`,
      quantity: productItem.quantity || 1,
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

  // Fetch distributor IDs from reverse_distributors table
  const distributorNameToIdMap: Record<string, string> = {};
  if (distributorNames.size > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name')
      .in('name', Array.from(distributorNames));

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        distributorNameToIdMap[dist.name] = dist.id;
      });
    }
  }

  // Check availability for each distributor
  // Get the most recent report_date for each pharmacy-distributor combination
  const distributorAvailabilityMap: Record<string, boolean> = {};
  
  for (const distributorName of distributorNames) {
    const distributorId = distributorNameToIdMap[distributorName];
    
    if (!distributorId) {
      // If distributor not found, mark as unavailable
      distributorAvailabilityMap[distributorName] = false;
      continue;
    }

    // Get the most recent report_date for this pharmacy-distributor combination
    const { data: recentDocuments, error: docError } = await db
      .from('uploaded_documents')
      .select('report_date')
      .eq('pharmacy_id', pharmacyId)
      .eq('reverse_distributor_id', distributorId)
      .not('report_date', 'is', null)
      .order('report_date', { ascending: false })
      .limit(1);

    if (docError || !recentDocuments || recentDocuments.length === 0 || !recentDocuments[0]?.report_date) {
      // No data found, mark as available (no recent activity)
      distributorAvailabilityMap[distributorName] = true;
      continue;
    }

    const recentDocument = recentDocuments[0];

    // Check if report_date is within last 30 days
    const reportDate = new Date(recentDocument.report_date);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const reportDateStr = reportDate.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // If report_date is within last 30 days, mark as unavailable (active = false)
    // Otherwise, mark as available (active = true)
    distributorAvailabilityMap[distributorName] = reportDateStr < thirtyDaysAgoStr;
  }

  // Now update recommendations: select highest available price as recommended
  recommendations.forEach((rec) => {
    if (!rec._distributorAverages || rec._distributorAverages.length === 0) {
      return;
    }

    // Find the highest price distributor that IS available
    let recommended: { name: string; price: number } | null = null;
    const alternatives: Array<{ name: string; price: number; difference: number; available: boolean }> = [];

    // First, find the highest available distributor
    for (const dist of rec._distributorAverages) {
      const isAvailable = distributorAvailabilityMap[dist.name] ?? false;
      
      if (!recommended && isAvailable) {
        // First available distributor (which is also highest price since sorted)
        recommended = dist;
        break; // Found the recommended one
      }
    }

    // If no available distributor found, use the highest price one anyway (even if unavailable)
    if (!recommended && rec._distributorAverages.length > 0) {
      recommended = rec._distributorAverages[0];
    }

    // Now build alternatives list (all distributors except the recommended one)
    if (recommended) {
      rec._distributorAverages.forEach((dist) => {
        if (dist.name !== recommended!.name) {
          alternatives.push({
            name: dist.name,
            price: dist.price,
            difference: dist.price - recommended!.price, // Negative means lower price (worse)
            available: distributorAvailabilityMap[dist.name] ?? false,
          });
        }
      });
    }

    if (recommended) {
      rec.recommendedDistributor = recommended.name;
      rec.expectedPrice = recommended.price;
      rec.available = distributorAvailabilityMap[recommended.name] ?? false;
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
  // Get total active distributors
  const { data: allActiveDistributors, error: allDistError } = await db
    .from('reverse_distributors')
    .select('id')
    .eq('is_active', true);

  const totalDistributors = allActiveDistributors?.length || 0;

  // Get distributors used this month (distributors with last document's report_date within last 30 days)
  // Use the same logic as top distributors: order by report_date DESC and check if latest is within 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Get all active distributors and check their last document's report_date
  const uniqueUsedDistributorIds = new Set<string>();
  
  if (allActiveDistributors && allActiveDistributors.length > 0) {
    for (const dist of allActiveDistributors) {
      // Get the most recent document for this pharmacy and distributor (by report_date)
      const { data: lastDocument, error: docError } = await db
        .from('uploaded_documents')
        .select('report_date')
        .eq('pharmacy_id', pharmacyId)
        .eq('reverse_distributor_id', dist.id)
        .not('report_date', 'is', null)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!docError && lastDocument && lastDocument.report_date) {
        const reportDateStr = new Date(lastDocument.report_date).toISOString().split('T')[0];
        // If last document's report_date is within last 30 days, mark as used
        if (reportDateStr >= thirtyDaysAgoStr) {
          uniqueUsedDistributorIds.add(dist.id);
        }
      }
    }
  }

  const usedThisMonth = uniqueUsedDistributorIds.size;
  const stillAvailable = Math.max(0, totalDistributors - usedThisMonth);

  // Create a map to check if a distributor (by name) is still available this month
  // A distributor is "still available this month" if last document's report_date is NOT within last 30 days
  const distributorNameToStillAvailableMap: Record<string, boolean> = {};
  
  // Check each distributor name - use same logic: order by report_date DESC and check latest
  for (const distributorName of distributorNames) {
    const distributorId = distributorNameToIdMap[distributorName];
    
    if (!distributorId) {
      // If we don't have an ID, assume it's available
      distributorNameToStillAvailableMap[distributorName] = true;
      continue;
    }

    // Get the most recent document for this pharmacy and distributor (by report_date)
    const { data: lastDocument, error: docError } = await db
      .from('uploaded_documents')
      .select('report_date')
      .eq('pharmacy_id', pharmacyId)
      .eq('reverse_distributor_id', distributorId)
      .not('report_date', 'is', null)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError || !lastDocument || !lastDocument.report_date) {
      // No document found, mark as available
      distributorNameToStillAvailableMap[distributorName] = true;
      continue;
    }

    // Check if last document's report_date is within last 30 days
    const reportDateStr = new Date(lastDocument.report_date).toISOString().split('T')[0];
    // If within 30 days, NOT available (used this month)
    // If older than 30 days, available (still available this month)
    distributorNameToStillAvailableMap[distributorName] = reportDateStr < thirtyDaysAgoStr;
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
    const stillAvailable = distributorNameToStillAvailableMap[distributorName] ?? false;
    if (!stillAvailable) continue; // Skip distributors not available this month
    
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

    // Filter to only distributors still available this month and sort by price (highest first)
    const availableThisMonthOptions = allOptions
      .filter((opt) => opt.stillAvailableThisMonth)
      .sort((a, b) => b.price - a.price);

    if (availableThisMonthOptions.length > 0) {
      // Use the best distributor that's still available this month
      const bestAvailable = availableThisMonthOptions[0];
      const earnings = bestAvailable.price * rec.quantity;
      multipleDistributorsStrategy += earnings;
    } else {
      // If no distributors are still available this month, use the recommended one anyway
      const earnings = rec.expectedPrice * rec.quantity;
      multipleDistributorsStrategy += earnings;
    }
  });

  const potentialAdditionalEarnings = Math.max(0, multipleDistributorsStrategy - singleDistributorStrategy);

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

