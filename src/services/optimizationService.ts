import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface OptimizationRecommendation {
  ndc: string;
  productName: string;
  quantity: number;
  recommendedDistributor: string;
  expectedPrice: number;
  available?: boolean;
  alternativeDistributors: Array<{
    name: string;
    price: number;
    difference: number;
    available?: boolean;
  }>;
  savings: number;
}

export interface OptimizationResponse {
  recommendations: OptimizationRecommendation[];
  totalPotentialSavings: number;
  generatedAt: string;
}

// Get optimization recommendations for pharmacy products
export const getOptimizationRecommendations = async (
  pharmacyId: string
): Promise<OptimizationResponse> => {
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
      recommendations: [],
      totalPotentialSavings: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  // Step 2: Extract unique NDCs
  const ndcs = [...new Set(productItems.map((item) => item.ndc))];

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
      
      // Find matching NDC from product list (try both normalized and original)
      const matchingNdc = ndcs.find(n => {
        const normalizedProductNdc = String(n).replace(/-/g, '').trim();
        return normalizedProductNdc === normalizedNdcCode || 
               String(n).trim() === String(ndcCode).trim() ||
               normalizedProductNdc === String(ndcCode).replace(/-/g, '').trim();
      });
      
      if (!matchingNdc) {
        return;
      }

      const quantity = Number(item.quantity) || 1;
      const creditAmount = Number(item.creditAmount) || 0;
      const pricePerUnit = Number(item.pricePerUnit) || (quantity > 0 && creditAmount > 0 ? creditAmount / quantity : 0);

      if (pricePerUnit > 0) {
        ndcPricingMap[matchingNdc].push({
          distributorName,
          pricePerUnit,
          creditAmount,
          quantity,
        });
        console.log(`✅ Matched NDC ${matchingNdc} with distributor "${distributorName}", price: ${pricePerUnit}`);
      } else {
        console.log(`❌ Skipped NDC ${matchingNdc} - invalid price: ${pricePerUnit}`);
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

    const recommended = distributorAverages[0]; // Highest price = best
    // Show ALL alternatives, not just one
    const alternatives = distributorAverages.slice(1).map((alt) => ({
      name: alt.name,
      price: alt.price,
      difference: alt.price - recommended.price, // Negative means lower price (worse)
    }));

    // Debug: Log final results
    console.log(`📊 Final result for NDC ${ndc}:`);
    console.log(`   - Total distributors: ${distributorAverages.length}`);
    console.log(`   - Recommended: "${recommended.name}" at $${recommended.price}`);
    console.log(`   - Alternatives: ${alternatives.length}`);
    alternatives.forEach((alt, i) => {
      console.log(`     ${i+1}. "${alt.name}" at $${alt.price} (diff: ${alt.difference >= 0 ? '+' : ''}${alt.difference})`);
    });
    console.log(`--- End NDC ${ndc} ---\n`);

    // Calculate savings (difference between best (highest) and worst (lowest) price, multiplied by quantity)
    const worstPrice = distributorAverages[distributorAverages.length - 1].price; // Lowest price
    const savings = (recommended.price - worstPrice) * (productItem.quantity || 1);

    recommendations.push({
      ndc,
      productName: productItem.product_name || `Product ${ndc}`,
      quantity: productItem.quantity || 1,
      recommendedDistributor: recommended.name,
      expectedPrice: recommended.price,
      alternativeDistributors: alternatives, // Already mapped above
      savings: Math.max(0, savings), // Ensure non-negative
    });
  });

  // Calculate total potential savings
  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);

  // Collect all unique distributor names from recommendations
  const distributorNames = new Set<string>();
  recommendations.forEach((rec) => {
    distributorNames.add(rec.recommendedDistributor);
    rec.alternativeDistributors.forEach((alt) => {
      distributorNames.add(alt.name);
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
      // No data found, mark as unavailable
      distributorAvailabilityMap[distributorName] = false;
      continue;
    }

    const recentDocument = recentDocuments[0];

    // Check if report_date is within last 30 days
    const reportDate = new Date(recentDocument.report_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If within 30 days, mark as unavailable (data is too recent, might not be current)
    // Otherwise, mark as available (data is older, likely still valid)
    distributorAvailabilityMap[distributorName] = daysDiff > 30;
  }

  // Add availability flags to recommendations
  recommendations.forEach((rec) => {
    rec.available = distributorAvailabilityMap[rec.recommendedDistributor] ?? false;
    rec.alternativeDistributors.forEach((alt) => {
      alt.available = distributorAvailabilityMap[alt.name] ?? false;
    });
  });

  return {
    recommendations,
    totalPotentialSavings,
    generatedAt: new Date().toISOString(),
  };
};

