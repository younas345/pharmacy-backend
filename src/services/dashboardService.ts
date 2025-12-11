import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';
// import { getOptimizationRecommendations } from './optimizationService';

export interface DashboardSummary {
  totalPharmacyAddedProducts: number;
  topDistributorCount: number;
  totalPackages: number;
  deliveredPackages: number;
  nonDeliveredPackages: number;
  // Commented out fields - keeping for reference
  // totalDocuments: number;
  // documentsThisMonth: number;
  // lastUpload: string | null;
  // totalDistributors: number;
  // totalNDCs: number;
  // totalDataPoints: number;
  // priceVariance: number;
  // potentialSavings: number;
  // activeInventory: number;
  // totalReturns: number;
  // pendingReturns: number;
  // completedReturns: number;
  // totalEstimatedCredits: number;
  // expiringItems: number;
}

export const getDashboardSummary = async (pharmacyId: string): Promise<DashboardSummary> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Get total pharmacy added products (from product_list_items where added_by = pharmacyId)
  const { count: pharmacyAddedProductsCount } = await db
    .from('product_list_items')
    .select('*', { count: 'exact', head: true })
    .eq('added_by', pharmacyId);

  // Get top distributor count - count all active distributors
  // This matches the getTopDistributors API which returns all active distributors
  // regardless of whether they have documents with this pharmacy
  const { count: topDistributorCount, error: distError } = await db
    .from('reverse_distributors')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (distError) {
    throw new AppError(`Failed to fetch distributors: ${distError.message}`, 400);
  }

  // Get package statistics using the same logic as /api/optimization/custom-packages
  // Get count of packages with status true (delivered)
  const { count: deliveredPackagesCount, error: deliveredCountError } = await db
    .from('custom_packages')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', true);

  if (deliveredCountError) {
    throw new AppError(`Failed to fetch delivered packages count: ${deliveredCountError.message}`, 400);
  }

  // Get count of packages with status false (non-delivered)
  const { count: nonDeliveredPackagesCount, error: nonDeliveredCountError } = await db
    .from('custom_packages')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', false);

  if (nonDeliveredCountError) {
    throw new AppError(`Failed to fetch non-delivered packages count: ${nonDeliveredCountError.message}`, 400);
  }

  // Calculate total packages (delivered + non-delivered)
  const totalPackages = (deliveredPackagesCount || 0) + (nonDeliveredPackagesCount || 0);

  // Commented out - old logic for reference
  // // Get total documents
  // const { count: documentsCount } = await db
  //   .from('uploaded_documents')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId);

  // // Get documents this month
  // const now = new Date();
  // const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // const { count: documentsThisMonthCount } = await db
  //   .from('uploaded_documents')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId)
  //   .gte('uploaded_at', firstDayOfMonth.toISOString());

  // // Get last upload date
  // const { data: lastDocument } = await db
  //   .from('uploaded_documents')
  //   .select('uploaded_at')
  //   .eq('pharmacy_id', pharmacyId)
  //   .order('uploaded_at', { ascending: false })
  //   .limit(1)
  //   .maybeSingle();

  // const lastUpload = lastDocument?.uploaded_at || null;

  // // Get total unique distributors from documents
  // const { data: distributorsData } = await db
  //   .from('uploaded_documents')
  //   .select('reverse_distributor_id')
  //   .eq('pharmacy_id', pharmacyId)
  //   .not('reverse_distributor_id', 'is', null);
  
  // const uniqueDistributors = new Set((distributorsData || []).map(d => d.reverse_distributor_id)).size;

  // // Get total unique NDCs from return_reports (where actual NDC data is stored)
  // const { data: returnReportsData } = await db
  //   .from('return_reports')
  //   .select('data')
  //   .eq('pharmacy_id', pharmacyId);
  
  // // Extract unique NDCs from return_reports data JSONB field
  // const uniqueNDCsSet = new Set<string>();
  // (returnReportsData || []).forEach((report: any) => {
  //   const data = report.data;
  //   // Handle different data structures
  //   if (data?.ndcCode) {
  //     uniqueNDCsSet.add(String(data.ndcCode).trim());
  //   } else if (data?.ndc) {
  //     uniqueNDCsSet.add(String(data.ndc).trim());
  //   }
  // });
  
  // const uniqueNDCs = uniqueNDCsSet.size;

  // // Get total inventory items
  // const { count: inventoryCount } = await db
  //   .from('inventory_items')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId);

  // // Get expiring items (status = 'expiring_soon')
  // const { count: expiringCount } = await db
  //   .from('inventory_items')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId)
  //   .eq('status', 'expiring_soon');

  // // Get total returns
  // const { count: returnsCount } = await db
  //   .from('returns')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId);

  // // Get pending returns
  // const { count: pendingReturnsCount } = await db
  //   .from('returns')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId)
  //   .in('status', ['draft', 'ready_to_ship']);

  // // Get completed returns
  // const { count: completedReturnsCount } = await db
  //   .from('returns')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('pharmacy_id', pharmacyId)
  //   .eq('status', 'completed');

  // // Get total estimated credits from all returns
  // const { data: returnsData } = await db
  //   .from('returns')
  //   .select('total_estimated_credit')
  //   .eq('pharmacy_id', pharmacyId);
  
  // const totalEstimatedCredits = (returnsData || []).reduce((sum, r) => sum + (r.total_estimated_credit || 0), 0);

  // // Calculate price variance from return_reports
  // // Get all pricePerUnit values from return_reports
  // const allPrices: number[] = [];
  // (returnReportsData || []).forEach((report: any) => {
  //   const data = report.data;
  //   if (data?.pricePerUnit && typeof data.pricePerUnit === 'number' && data.pricePerUnit > 0) {
  //     allPrices.push(data.pricePerUnit);
  //   }
  // });

  // let priceVariance = 0;
  // if (allPrices.length > 1) {
  //   // Calculate variance: average of squared differences from mean
  //   const mean = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
  //   const squaredDiffs = allPrices.map(p => Math.pow(p - mean, 2));
  //   const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / allPrices.length;
  //   // Price variance as percentage of mean
  //   priceVariance = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
  // }

  // // Calculate potential savings using the same logic as optimization API
  // // Get totalPotentialSavings from optimization recommendations
  // let potentialSavings = 0;
  // try {
  //   const optimizationData = await getOptimizationRecommendations(pharmacyId);
  //   potentialSavings = optimizationData.totalPotentialSavings;
  // } catch (error: any) {
  //   // If optimization fails, set to 0 (don't break dashboard)
  //   console.warn('⚠️ Failed to get optimization data for potential savings:', error.message);
  //   potentialSavings = 0;
  // }

  return {
    totalPharmacyAddedProducts: pharmacyAddedProductsCount || 0,
    topDistributorCount: topDistributorCount || 0,
    totalPackages: totalPackages,
    deliveredPackages: deliveredPackagesCount || 0,
    nonDeliveredPackages: nonDeliveredPackagesCount || 0,
    // Commented out - old return values for reference
    // totalDocuments: documentsCount || 0,
    // documentsThisMonth: documentsThisMonthCount || 0,
    // lastUpload: lastUpload ? new Date(lastUpload).toISOString() : null,
    // totalDistributors: uniqueDistributors,
    // totalNDCs: uniqueNDCs,
    // totalDataPoints: documentsCount || 0, // Total documents = data points
    // priceVariance: Math.round(priceVariance * 100) / 100, // Round to 2 decimal places
    // potentialSavings: Math.round(potentialSavings * 100) / 100, // Round to 2 decimal places
    // activeInventory: inventoryCount || 0,
    // totalReturns: returnsCount || 0,
    // pendingReturns: pendingReturnsCount || 0,
    // completedReturns: completedReturnsCount || 0,
    // totalEstimatedCredits: Math.round(totalEstimatedCredits * 100) / 100,
    // expiringItems: expiringCount || 0,
  };
};

