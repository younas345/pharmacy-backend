import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface DashboardSummary {
  totalDocuments: number;
  totalDistributors: number;
  totalNDCs: number;
  totalDataPoints: number;
  activeInventory: number;
  totalReturns: number;
  pendingReturns: number;
  completedReturns: number;
  totalEstimatedCredits: number;
  expiringItems: number;
}

export const getDashboardSummary = async (pharmacyId: string): Promise<DashboardSummary> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Get total documents
  const { count: documentsCount } = await db
    .from('uploaded_documents')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId);

  // Get total unique distributors from documents
  const { data: distributorsData } = await db
    .from('uploaded_documents')
    .select('reverse_distributor_id')
    .eq('pharmacy_id', pharmacyId)
    .not('reverse_distributor_id', 'is', null);
  
  const uniqueDistributors = new Set((distributorsData || []).map(d => d.reverse_distributor_id)).size;

  // Get total unique NDCs from inventory
  const { data: ndcData } = await db
    .from('inventory_items')
    .select('ndc')
    .eq('pharmacy_id', pharmacyId);
  
  const uniqueNDCs = new Set((ndcData || []).map(d => d.ndc)).size;

  // Get total inventory items
  const { count: inventoryCount } = await db
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId);

  // Get expiring items (status = 'expiring_soon')
  const { count: expiringCount } = await db
    .from('inventory_items')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', 'expiring_soon');

  // Get total returns
  const { count: returnsCount } = await db
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId);

  // Get pending returns
  const { count: pendingReturnsCount } = await db
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .in('status', ['draft', 'ready_to_ship']);

  // Get completed returns
  const { count: completedReturnsCount } = await db
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', 'completed');

  // Get total estimated credits from all returns
  const { data: returnsData } = await db
    .from('returns')
    .select('total_estimated_credit')
    .eq('pharmacy_id', pharmacyId);
  
  const totalEstimatedCredits = (returnsData || []).reduce((sum, r) => sum + (r.total_estimated_credit || 0), 0);

  return {
    totalDocuments: documentsCount || 0,
    totalDistributors: uniqueDistributors,
    totalNDCs: uniqueNDCs,
    totalDataPoints: (documentsCount || 0) + (inventoryCount || 0) + (returnsCount || 0),
    activeInventory: inventoryCount || 0,
    totalReturns: returnsCount || 0,
    pendingReturns: pendingReturnsCount || 0,
    completedReturns: completedReturnsCount || 0,
    totalEstimatedCredits,
    expiringItems: expiringCount || 0,
  };
};

