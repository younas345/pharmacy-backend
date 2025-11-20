import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface UploadedDocument {
  id: string;
  pharmacy_id: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  file_url?: string;
  reverse_distributor_id?: string;
  source: 'manual_upload' | 'email_forward' | 'portal_fetch' | 'api';
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'needs_review';
  uploaded_at: string;
  processed_at?: string;
  error_message?: string;
  extracted_items: number;
  total_credit_amount?: number;
  processing_progress?: number;
}

export const getDocuments = async (
  pharmacyId: string,
  filters?: {
    status?: UploadedDocument['status'];
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ documents: UploadedDocument[]; total: number }> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Join with reverse_distributors to get distributor name
  let query = db
    .from('uploaded_documents')
    .select(`
      *,
      reverse_distributors (
        id,
        name,
        code
      )
    `, { count: 'exact' })
    .eq('pharmacy_id', pharmacyId)
    .order('uploaded_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`file_name.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new AppError(`Failed to fetch documents: ${error.message}`, 400);
  }

  // Transform data to include distributor name
  const documents = (data || []).map((doc: any) => ({
    ...doc,
    reverse_distributor_name: doc.reverse_distributors?.name || null,
  }));

  return {
    documents,
    total: count || 0,
  };
};

export const getDocumentById = async (
  pharmacyId: string,
  documentId: string
): Promise<UploadedDocument> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data, error } = await db
    .from('uploaded_documents')
    .select(`
      *,
      reverse_distributors (
        id,
        name,
        code
      )
    `)
    .eq('id', documentId)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (error) {
    throw new AppError(`Failed to fetch document: ${error.message}`, 404);
  }

  // Transform data to include distributor name
  return {
    ...data,
    reverse_distributor_name: data.reverse_distributors?.name || null,
  };
};

export const deleteDocument = async (pharmacyId: string, documentId: string): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { error } = await db
    .from('uploaded_documents')
    .delete()
    .eq('id', documentId)
    .eq('pharmacy_id', pharmacyId);

  if (error) {
    throw new AppError(`Failed to delete document: ${error.message}`, 400);
  }
};

export interface CreateDocumentInput {
  pharmacy_id: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  file_url?: string;
  reverse_distributor_id?: string;
  source?: 'manual_upload' | 'email_forward' | 'portal_fetch' | 'api';
  extracted_items?: number;
  total_credit_amount?: number;
  status?: 'uploading' | 'processing' | 'completed' | 'failed' | 'needs_review';
}

export const createDocument = async (input: CreateDocumentInput): Promise<UploadedDocument> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const documentData = {
    pharmacy_id: input.pharmacy_id,
    file_name: input.file_name,
    file_size: input.file_size,
    file_type: input.file_type || 'application/pdf',
    file_url: input.file_url,
    reverse_distributor_id: input.reverse_distributor_id,
    source: input.source || 'manual_upload',
    status: input.status || 'completed',
    extracted_items: input.extracted_items || 0,
    total_credit_amount: input.total_credit_amount,
    processed_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('uploaded_documents')
    .insert(documentData)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create document: ${error.message}`, 400);
  }

  return data;
};

