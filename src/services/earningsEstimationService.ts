import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// Interface for individual NDC comparison data
export interface NdcComparisonData {
  ndcCode: string;
  productName: string;
  quantity: number;
  full: number;
  partial: number;
  actualEarned: number; // creditAmount from their report
  bestDistributor: {
    id: string;
    name: string;
    pricePerUnit: number;
    potentialEarnings: number;
  };
  potentialAdditionalEarnings: number; // best - current
  percentageDifference: number; // Percentage increase they could have gotten
}

// Interface for chart data by period
export interface PeriodChartData {
  period: string; // Format: "YYYY-MM" for monthly, "YYYY" for yearly
  label: string; // Human-readable label (e.g., "January 2025")
  actualEarnings: number; // What they actually earned (sum of creditAmount)
  potentialEarnings: number; // What they could have earned with best prices
  difference: number; // potentialEarnings - actualEarnings
}

// Interface for graph-friendly response
export interface EarningsEstimationResponse {
  summary: {
    totalActualEarnings: number;
    totalPotentialEarnings: number;
    totalMissedEarnings: number;
    optimizationScore: number; // 0-100, how well they optimized (100 = perfect choices)
    isAlreadyOptimal: boolean; // true if they already earned the best
    periodType: 'monthly' | 'yearly';
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
  chartData: PeriodChartData[]; // For line/bar chart showing earnings over time
  topMissedOpportunities: NdcComparisonData[]; // Top 10 NDCs where they could have earned more
}

/**
 * Normalize NDC code by removing dashes and ensuring consistent format
 */
const normalizeNdc = (ndc: string): string => {
  return String(ndc).replace(/[-\s]/g, '').trim().toUpperCase();
};

/**
 * Fetch all records from a Supabase query with pagination
 * Supabase has a default limit of 1000 records, so we need to paginate to get all
 */
const fetchAllRecords = async <T>(
  queryBuilder: any,
  batchSize: number = 1000
): Promise<T[]> => {
  const allRecords: T[] = [];
  let offset = 0;
  let hasMore = true;
  let batchNumber = 0;

  while (hasMore) {
    batchNumber++;
    const { data, error } = await queryBuilder.range(offset, offset + batchSize - 1);

    if (error) {
      throw new AppError(`Failed to fetch records (batch ${batchNumber}): ${error.message}`, 400);
    }

    if (data && data.length > 0) {
      allRecords.push(...data);
      offset += batchSize;
      
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allRecords;
};

// Interface for distributor pricing with separate full/partial prices
interface DistributorPricingInfo {
  distributorId: string;
  distributorName: string;
  fullPricePerUnit: number | null;
  fullPriceReportDate: string | null;
  partialPricePerUnit: number | null;
  partialPriceReportDate: string | null;
}

/**
 * Get the latest pricing for each distributor-NDC combination from all return reports
 * This builds a comprehensive pricing database from all historical data
 */
const getLatestDistributorPricing = async (db: any): Promise<Map<string, Map<string, DistributorPricingInfo>>> => {
  console.log(`📥 Fetching ALL return reports for pricing database (with pagination)...`);
  
  const queryBuilder = db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      created_at,
      uploaded_documents (
        id,
        report_date,
        reverse_distributor_id,
        reverse_distributors (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  const returnReports = await fetchAllRecords(queryBuilder);
  console.log(`✅ Fetched ${returnReports.length} total return reports for pricing database`);

  // Sort all reports by report_date DESC (most recent first)
  const sortedReports = (returnReports || []).sort((a: any, b: any) => {
    const dateA = a.uploaded_documents?.report_date || a.created_at?.split('T')[0] || '';
    const dateB = b.uploaded_documents?.report_date || b.created_at?.split('T')[0] || '';
    return dateB.localeCompare(dateA);
  });

  // Map: NDC -> Map<distributorId, pricing info>
  const ndcDistributorPricing = new Map<string, Map<string, DistributorPricingInfo>>();

  sortedReports.forEach((report: any) => {
    const data = report.data;
    const uploadedDoc = report.uploaded_documents;
    
    if (!data || !uploadedDoc?.reverse_distributors) return;

    const distributorId = uploadedDoc.reverse_distributor_id;
    const distributorName = uploadedDoc.reverse_distributors.name || 'Unknown Distributor';
    const reportDate = uploadedDoc.report_date || report.created_at?.split('T')[0] || '';

    const ndcCode = data.ndcCode || data.ndc;
    if (!ndcCode) return;

    const normalizedNdc = normalizeNdc(ndcCode);
    const pricePerUnit = Number(data.pricePerUnit) || 0;
    const full = Number(data.full) || 0;
    const partial = Number(data.partial) || 0;

    if (pricePerUnit <= 0) return;

    const isFullRecord = full > 0 && partial === 0;
    const isPartialRecord = partial > 0 && full === 0;

    if (!isFullRecord && !isPartialRecord) return;

    if (!ndcDistributorPricing.has(normalizedNdc)) {
      ndcDistributorPricing.set(normalizedNdc, new Map());
    }

    const distributorMap = ndcDistributorPricing.get(normalizedNdc)!;

    if (!distributorMap.has(distributorId)) {
      distributorMap.set(distributorId, {
        distributorId,
        distributorName,
        fullPricePerUnit: null,
        fullPriceReportDate: null,
        partialPricePerUnit: null,
        partialPriceReportDate: null,
      });
    }

    const existing = distributorMap.get(distributorId)!;

    if (isFullRecord) {
      const existingFullDate = existing.fullPriceReportDate || '';
      if (
        existing.fullPricePerUnit === null ||
        reportDate > existingFullDate ||
        (reportDate === existingFullDate && pricePerUnit > existing.fullPricePerUnit)
      ) {
        existing.fullPricePerUnit = pricePerUnit;
        existing.fullPriceReportDate = reportDate;
      }
    }

    if (isPartialRecord) {
      const existingPartialDate = existing.partialPriceReportDate || '';
      if (
        existing.partialPricePerUnit === null ||
        reportDate > existingPartialDate ||
        (reportDate === existingPartialDate && pricePerUnit > existing.partialPricePerUnit)
      ) {
        existing.partialPricePerUnit = pricePerUnit;
        existing.partialPriceReportDate = reportDate;
      }
    }
  });

  console.log(`✅ Built pricing database: ${ndcDistributorPricing.size} unique NDCs`);
  return ndcDistributorPricing;
};

/**
 * Get earnings estimation analysis for a pharmacy
 * 
 * New Logic:
 * 1. Get all uploaded documents for the pharmacy
 * 2. Fetch return reports for those documents
 * 3. Sum creditAmount per NDC
 * 4. Compare with best prices from all distributors
 * 5. Group by month/year based on report_date from uploaded_documents
 * 6. Return chart-friendly response
 */
export const getEarningsEstimation = async (
  pharmacyId: string,
  periodType: 'monthly' | 'yearly' = 'monthly',
  periods: number = 12
): Promise<EarningsEstimationResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate date range
  const now = new Date();
  let startDateStr: string;
  let endDateStr: string;
  
  if (periodType === 'yearly') {
    // For yearly: go back 'periods' years from current year
    const startYear = now.getFullYear() - periods;
    const endYear = now.getFullYear();
    startDateStr = `${startYear}-01-01`; // January 1st of start year
    endDateStr = `${endYear}-12-31`; // December 31st of current year
  } else {
    // For monthly: go back 'periods' months from current month
    const startDate = new Date(now.getFullYear(), now.getMonth() - periods, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    startDateStr = formatDateStr(startDate);
    endDateStr = formatDateStr(endDate);
  }

  console.log(`📊 Analyzing earnings estimation for pharmacy ${pharmacyId}`);
  console.log(`   Period: ${startDateStr} to ${endDateStr} (${periodType}, ${periods} periods)`);

  // Step 1: Get all pricing data from all distributors (for comparison)
  const ndcDistributorPricing = await getLatestDistributorPricing(db);
  console.log(`   Found pricing data for ${ndcDistributorPricing.size} unique NDCs`);

  // Step 2: Get ALL uploaded documents for the pharmacy
  console.log(`📥 Fetching ALL uploaded documents for pharmacy ${pharmacyId}...`);
  
  const docsQueryBuilder = db
    .from('uploaded_documents')
    .select(`
      id,
      pharmacy_id,
      report_date,
      total_credit_amount,
      reverse_distributor_id,
      reverse_distributors (
        id,
        name
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .eq('status', 'completed')
    .gte('report_date', startDateStr)
    .lte('report_date', endDateStr)
    .order('report_date', { ascending: false });

  const uploadedDocuments = await fetchAllRecords(docsQueryBuilder);
  console.log(`✅ Fetched ${uploadedDocuments.length} uploaded documents for pharmacy`);
  
  if (uploadedDocuments.length > 0) {
    console.log(`📋 Sample documents:`)
    uploadedDocuments.slice(0, 3).forEach((doc: any, index: number) => {
      console.log(`   ${index + 1}. ID: ${doc.id}, Date: ${doc.report_date}, Credit: $${doc.total_credit_amount || 'N/A'}`);
    });
  }

  if (uploadedDocuments.length === 0) {
    return {
      summary: {
        totalActualEarnings: 0,
        totalPotentialEarnings: 0,
        totalMissedEarnings: 0,
        optimizationScore: 100,
        isAlreadyOptimal: true,
        periodType,
        dateRange: {
          startDate: startDateStr,
          endDate: endDateStr,
        },
      },
      chartData: [],
      topMissedOpportunities: [],
    };
  }

  // Step 3: Get ALL return reports for these documents
  const documentIds = uploadedDocuments.map((doc: any) => doc.id);
  
  console.log(`📥 Fetching return reports for ${documentIds.length} documents...`);
  
  const reportsQueryBuilder = db
    .from('return_reports')
    .select(`
      id,
      data,
      document_id,
      created_at
    `)
    .in('document_id', documentIds);

  const returnReports = await fetchAllRecords(reportsQueryBuilder);
  console.log(`✅ Fetched ${returnReports.length} return reports`);

  // Create a map of document_id -> document info (for report_date lookup)
  const documentMap = new Map<string, any>();
  uploadedDocuments.forEach((doc: any) => {
    documentMap.set(doc.id, doc);
  });
  
  if (returnReports.length > 0) {
    console.log(`📋 Sample return reports:`)
    returnReports.slice(0, 3).forEach((report: any, index: number) => {
      const doc = documentMap.get(report.document_id);
      console.log(`   ${index + 1}. Doc ID: ${report.document_id}, Doc Date: ${doc?.report_date || 'N/A'}, Credit: $${report.data?.creditAmount || 'N/A'}`);
    });
  }

  // Helper functions for period handling
  const getPeriodKey = (dateStr: string): string => {
    // Parse date string directly to avoid timezone issues
    // dateStr format: "YYYY-MM-DD"
    const [year, month] = dateStr.split('-');
    if (periodType === 'yearly') {
      return year;
    } else {
      return `${year}-${month}`;
    }
  };

  const getPeriodLabel = (periodKey: string): string => {
    if (periodType === 'yearly') {
      return periodKey;
    } else {
      const [year, month] = periodKey.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
  };

  // Initialize period data map
  const periodDataMap: Record<string, {
    actualEarnings: number;
    potentialEarnings: number;
  }> = {};

  // Fill in all periods
  console.log(`📅 Initializing periods from ${startDateStr} to ${endDateStr}`);
  
  if (periodType === 'yearly') {
    // For yearly, create periods for each year
    const startYear = parseInt(startDateStr.split('-')[0]);
    const endYear = parseInt(endDateStr.split('-')[0]);
    for (let year = startYear; year <= endYear; year++) {
      const periodKey = year.toString();
      periodDataMap[periodKey] = {
        actualEarnings: 0,
        potentialEarnings: 0,
      };
      console.log(`   📅 Created period: ${periodKey} (${getPeriodLabel(periodKey)})`);
    }
  } else {
    // For monthly, create periods for each month
    const [startYear, startMonth] = startDateStr.split('-').map(Number);
    const [endYear, endMonth] = endDateStr.split('-').map(Number);
    
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const periodKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      periodDataMap[periodKey] = {
        actualEarnings: 0,
        potentialEarnings: 0,
      };
      console.log(`   📅 Created period: ${periodKey} (${getPeriodLabel(periodKey)})`);
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }
  
  console.log(`📅 Total periods initialized: ${Object.keys(periodDataMap).length}`);

  // Track NDC comparison data for top missed opportunities
  const ndcComparisonMap: Map<string, {
    ndcCode: string;
    productName: string;
    quantity: number;
    full: number;
    partial: number;
    actualEarned: number;
    bestPricePerUnit: number;
    bestDistributorId: string;
    bestDistributorName: string;
    potentialEarnings: number;
  }> = new Map();

  // Step 4: Process each return report
  let totalActualEarnings = 0;
  let totalPotentialEarnings = 0;

  returnReports.forEach((report: any) => {
    const data = report.data;
    const documentId = report.document_id;
    const document = documentMap.get(documentId);
    
    if (!data || !document) return;

    const reportDate = document.report_date;
    if (!reportDate) return;

    const periodKey = getPeriodKey(reportDate);
    if (!periodDataMap[periodKey]) {
      // Only log first few mismatches to avoid spam
      if (Object.keys(periodDataMap).length > 0) {
        console.log(`⚠️  Period ${periodKey} (from date ${reportDate}) not found. Available: ${Object.keys(periodDataMap).join(', ')}`);
      }
      return;
    }

    const ndcCode = data.ndcCode || data.ndc;
    if (!ndcCode) return;

    const normalizedNdc = normalizeNdc(ndcCode);
    const quantity = Number(data.quantity) || 0;
    const full = Number(data.full) || 0;
    const partial = Number(data.partial) || 0;
    const creditAmount = Number(data.creditAmount) || 0;

    if (creditAmount <= 0) return;

    // Determine if this is a FULL or PARTIAL record
    const isFullRecord = full > 0 && partial === 0;
    const isPartialRecord = partial > 0 && full === 0;

    // Track actual earnings (creditAmount)
    totalActualEarnings += creditAmount;
    periodDataMap[periodKey].actualEarnings += creditAmount;

    // Find best distributor price for this NDC
    const distributorPrices = ndcDistributorPricing.get(normalizedNdc);
    let bestPricePerUnit = 0;
    let bestDistributorId = '';
    let bestDistributorName = '';

    if (distributorPrices) {
      distributorPrices.forEach((pricing) => {
        let relevantPrice: number | null = null;
        
        if (isFullRecord) {
          relevantPrice = pricing.fullPricePerUnit;
        } else if (isPartialRecord) {
          relevantPrice = pricing.partialPricePerUnit;
        } else {
          // For mixed or unknown, take the best available price
          relevantPrice = Math.max(pricing.fullPricePerUnit || 0, pricing.partialPricePerUnit || 0);
        }

        if (relevantPrice !== null && relevantPrice > bestPricePerUnit) {
          bestPricePerUnit = relevantPrice;
          bestDistributorId = pricing.distributorId;
          bestDistributorName = pricing.distributorName;
        }
      });
    }

    // Calculate potential earnings with best price
    const potentialEarnings = bestPricePerUnit > 0 ? bestPricePerUnit * quantity : creditAmount;
    
    totalPotentialEarnings += potentialEarnings;
    periodDataMap[periodKey].potentialEarnings += potentialEarnings;

    // Track for top missed opportunities (aggregate by NDC)
    const existingNdc = ndcComparisonMap.get(normalizedNdc);
    if (existingNdc) {
      existingNdc.quantity += quantity;
      existingNdc.full += full;
      existingNdc.partial += partial;
      existingNdc.actualEarned += creditAmount;
      existingNdc.potentialEarnings += potentialEarnings;
      // Update best price if this one is higher
      if (bestPricePerUnit > existingNdc.bestPricePerUnit) {
        existingNdc.bestPricePerUnit = bestPricePerUnit;
        existingNdc.bestDistributorId = bestDistributorId;
        existingNdc.bestDistributorName = bestDistributorName;
      }
    } else {
      ndcComparisonMap.set(normalizedNdc, {
        ndcCode,
        productName: data.itemName || data.productDescription || `Product ${ndcCode}`,
        quantity,
        full,
        partial,
        actualEarned: creditAmount,
        bestPricePerUnit,
        bestDistributorId,
        bestDistributorName,
        potentialEarnings,
      });
    }
  });

  // Calculate summary metrics
  const totalMissedEarnings = totalPotentialEarnings - totalActualEarnings;
  const optimizationScore = totalPotentialEarnings > 0 
    ? Math.round((totalActualEarnings / totalPotentialEarnings) * 100) 
    : 100;
  const isAlreadyOptimal = totalMissedEarnings < 1; // Less than $1 difference is considered optimal

  // Convert period data to chart data array
  const chartData: PeriodChartData[] = Object.entries(periodDataMap)
    .map(([period, data]) => ({
      period,
      label: getPeriodLabel(period),
      actualEarnings: Math.round(data.actualEarnings * 100) / 100,
      potentialEarnings: Math.round(data.potentialEarnings * 100) / 100,
      difference: Math.round((data.potentialEarnings - data.actualEarnings) * 100) / 100,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Get top 10 missed opportunities
  const topMissedOpportunities: NdcComparisonData[] = Array.from(ndcComparisonMap.values())
    .map(item => {
      const potentialAdditionalEarnings = item.potentialEarnings - item.actualEarned;
      const percentageDifference = item.actualEarned > 0 
        ? Math.round((potentialAdditionalEarnings / item.actualEarned) * 100 * 100) / 100
        : 0;
      
      return {
        ndcCode: item.ndcCode,
        productName: item.productName,
        quantity: item.quantity,
        full: item.full,
        partial: item.partial,
        actualEarned: Math.round(item.actualEarned * 100) / 100,
        bestDistributor: {
          id: item.bestDistributorId,
          name: item.bestDistributorName,
          pricePerUnit: item.bestPricePerUnit,
          potentialEarnings: Math.round(item.potentialEarnings * 100) / 100,
        },
        potentialAdditionalEarnings: Math.round(potentialAdditionalEarnings * 100) / 100,
        percentageDifference,
      };
    })
    .filter(item => item.potentialAdditionalEarnings > 0.01) // Only include if there's missed opportunity
    .sort((a, b) => {
      // Combined score: absolute amount (60%) + percentage (40%)
      const scoreA = a.potentialAdditionalEarnings * 0.6 + (a.percentageDifference * a.actualEarned * 0.4 / 100);
      const scoreB = b.potentialAdditionalEarnings * 0.6 + (b.percentageDifference * b.actualEarned * 0.4 / 100);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  console.log(`✅ Analysis complete:`);
  console.log(`   Total Actual Earnings: $${totalActualEarnings.toFixed(2)}`);
  console.log(`   Total Potential Earnings: $${totalPotentialEarnings.toFixed(2)}`);
  console.log(`   Missed Earnings: $${totalMissedEarnings.toFixed(2)}`);
  console.log(`   Optimization Score: ${optimizationScore}%`);
  console.log(`   Periods with data: ${Object.entries(periodDataMap).filter(([_, data]) => data.actualEarnings > 0).length}/${Object.keys(periodDataMap).length}`);

  return {
    summary: {
      totalActualEarnings: Math.round(totalActualEarnings * 100) / 100,
      totalPotentialEarnings: Math.round(totalPotentialEarnings * 100) / 100,
      totalMissedEarnings: Math.round(totalMissedEarnings * 100) / 100,
      optimizationScore,
      isAlreadyOptimal,
      periodType,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
    },
    chartData,
    topMissedOpportunities,
  };
};
