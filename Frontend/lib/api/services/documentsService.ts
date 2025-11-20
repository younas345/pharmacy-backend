/**
 * Documents API Service
 */

import { apiClient } from '../client';
import { UploadedDocument } from '@/types';

export interface DocumentsFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const documentsService = {
  /**
   * Get all documents
   */
  async getDocuments(filters?: DocumentsFilters): Promise<{ documents: UploadedDocument[]; total: number }> {
    const response = await apiClient.get<any[]>('/documents', filters);
    if (response.status === 'success' && response.data) {
      // Transform API response (snake_case) to frontend format (camelCase)
      const documents = (Array.isArray(response.data) ? response.data : []).map((doc: any) => ({
        id: doc.id,
        pharmacyId: doc.pharmacy_id,
        fileName: doc.file_name || '',
        fileSize: doc.file_size || 0,
        fileType: doc.file_type || 'application/pdf',
        reverseDistributorId: doc.reverse_distributor_id || '',
        reverseDistributorName: doc.reverse_distributor_name || 'Unknown Distributor',
        source: doc.source || 'manual_upload',
        status: doc.status || 'completed',
        uploadedAt: doc.uploaded_at || doc.created_at || new Date().toISOString(),
        processedAt: doc.processed_at,
        errorMessage: doc.error_message,
        extractedItems: doc.extracted_items || 0,
        totalCreditAmount: doc.total_credit_amount,
        processingProgress: doc.processing_progress,
      }));
      return {
        documents,
        total: response.total || 0,
      };
    }
    throw new Error(response.message || 'Failed to fetch documents');
  },

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<UploadedDocument> {
    const response = await apiClient.get<any>(`/documents/${id}`);
    if (response.status === 'success' && response.data) {
      const doc = response.data;
      // Transform API response (snake_case) to frontend format (camelCase)
      return {
        id: doc.id,
        pharmacyId: doc.pharmacy_id,
        fileName: doc.file_name || '',
        fileSize: doc.file_size || 0,
        fileType: doc.file_type || 'application/pdf',
        reverseDistributorId: doc.reverse_distributor_id || '',
        reverseDistributorName: doc.reverse_distributor_name || 'Unknown Distributor',
        source: doc.source || 'manual_upload',
        status: doc.status || 'completed',
        uploadedAt: doc.uploaded_at || doc.created_at || new Date().toISOString(),
        processedAt: doc.processed_at,
        errorMessage: doc.error_message,
        extractedItems: doc.extracted_items || 0,
        totalCreditAmount: doc.total_credit_amount,
        processingProgress: doc.processing_progress,
      };
    }
    throw new Error(response.message || 'Failed to fetch document');
  },

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const response = await apiClient.delete(`/documents/${id}`);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete document');
    }
  },

  /**
   * Upload and process a document
   */
  async uploadDocument(file: File, reverseDistributorId?: string): Promise<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (reverseDistributorId) {
      formData.append('reverse_distributor_id', reverseDistributorId);
    }

    const response = await apiClient.upload<any>('/return-reports/process', formData);
    if (response.status === 'success') {
      // If document is returned in response, transform it
      if (response.document) {
        const doc = response.document;
        return {
          id: doc.id,
          pharmacyId: doc.pharmacy_id,
          fileName: doc.file_name || file.name,
          fileSize: doc.file_size || file.size,
          fileType: doc.file_type || file.type,
          reverseDistributorId: doc.reverse_distributor_id || '',
          reverseDistributorName: doc.reverse_distributor_name || 'Unknown Distributor',
          source: doc.source || 'manual_upload',
          status: doc.status || 'completed',
          uploadedAt: doc.uploaded_at || new Date().toISOString(),
          processedAt: doc.processed_at,
          errorMessage: doc.error_message,
          extractedItems: doc.extracted_items || 0,
          totalCreditAmount: doc.total_credit_amount,
          processingProgress: doc.processing_progress,
        };
      }
      // If no document returned, create a minimal one from the file
      return {
        id: '',
        pharmacyId: '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        reverseDistributorId: reverseDistributorId || '',
        reverseDistributorName: 'Unknown Distributor',
        source: 'manual_upload',
        status: 'completed',
        uploadedAt: new Date().toISOString(),
        extractedItems: 0,
      };
    }
    throw new Error(response.message || 'Failed to upload document');
  },
};

