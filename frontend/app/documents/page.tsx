'use client';

import { useState } from 'react';
import { Search, Eye, CheckCircle, XCircle, Download, Trash2, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

const initialDocuments = [
    { id: 'DOC-1001', type: 'Return Receipt', pharmacy: 'HealthFirst Pharmacy', uploadDate: '2024-12-15', status: 'pending', fileSize: '2.4 MB', reviewer: null, fileName: 'return_receipt_001.pdf' },
    { id: 'DOC-1002', type: 'Return Receipt', pharmacy: 'City Care Pharmacy', uploadDate: '2024-12-14', status: 'pending', fileSize: '1.8 MB', reviewer: null, fileName: 'return_receipt_002.pdf' },
    { id: 'DOC-1003', type: 'Return Receipt', pharmacy: 'MedPlus Pharmacy', uploadDate: '2024-12-13', status: 'approved', fileSize: '3.1 MB', reviewer: 'Admin User', reviewDate: '2024-12-14', fileName: 'return_receipt_003.pdf' },
    { id: 'DOC-1004', type: 'Return Receipt', pharmacy: 'QuickMed Pharmacy', uploadDate: '2024-12-12', status: 'rejected', fileSize: '1.2 MB', reviewer: 'Admin User', reviewDate: '2024-12-13', rejectionReason: 'Incomplete information', fileName: 'return_receipt_004.pdf' },
    { id: 'DOC-1005', type: 'Return Receipt', pharmacy: 'HealthFirst Pharmacy', uploadDate: '2024-12-11', status: 'approved', fileSize: '2.7 MB', reviewer: 'Admin User', reviewDate: '2024-12-12', fileName: 'return_receipt_005.pdf' },
];

type Document = typeof initialDocuments[0];

export default function DocumentsPage() {
    const [documents, setDocuments] = useState(initialDocuments);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [viewModal, setViewModal] = useState<Document | null>(null);
    const [deleteModal, setDeleteModal] = useState<Document | null>(null);
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'danger';
            default: return 'default';
        }
    };

    const handleApprove = (doc: Document) => {
        setSelectedDoc(doc);
        setShowApproveModal(true);
    };

    const handleReject = (doc: Document) => {
        setSelectedDoc(doc);
        setShowRejectModal(true);
    };

    const confirmApprove = () => {
        if (selectedDoc) {
            setDocuments(prev => prev.map(d =>
                d.id === selectedDoc.id
                    ? { ...d, status: 'approved', reviewer: 'Admin User', reviewDate: new Date().toISOString().split('T')[0] }
                    : d
            ));
        }
        setShowApproveModal(false);
        setNotes('');
        setSelectedDoc(null);
    };

    const confirmReject = () => {
        if (selectedDoc) {
            setDocuments(prev => prev.map(d =>
                d.id === selectedDoc.id
                    ? { ...d, status: 'rejected', reviewer: 'Admin User', reviewDate: new Date().toISOString().split('T')[0], rejectionReason }
                    : d
            ));
        }
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedDoc(null);
    };

    const handleDownload = (doc: Document) => {
        // Simulate file download
        console.log('Downloading document:', doc.fileName);
        alert(`Downloading ${doc.fileName}...`);
    };

    const handleDelete = (doc: Document) => {
        setDeleteModal(doc);
    };

    const confirmDelete = () => {
        if (deleteModal) {
            setDocuments(prev => prev.filter(d => d.id !== deleteModal.id));
        }
        setDeleteModal(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-gray-600 mt-1">Review and manage return receipts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{documents.filter(d => d.status === 'pending').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{documents.filter(d => d.status === 'approved').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{documents.filter(d => d.status === 'rejected').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDocuments.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            {doc.type}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{doc.pharmacy}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{doc.uploadDate}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{doc.fileSize}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{doc.reviewer || '-'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewModal(doc)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {doc.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(doc)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(doc)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            {doc.status === 'rejected' && (
                                                <button
                                                    onClick={() => handleDelete(doc)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredDocuments.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No documents found</p>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Document</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to approve document <strong>{selectedDoc?.id}</strong> from <strong>{selectedDoc?.pharmacy}</strong>?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Add any notes..."
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => { setShowApproveModal(false); setNotes(''); }}>
                                Cancel
                            </Button>
                            <Button variant="success" onClick={confirmApprove}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Document</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for rejecting document <strong>{selectedDoc?.id}</strong>:
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Reason for rejection..."
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={confirmReject}
                                disabled={!rejectionReason.trim()}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
                            <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Document ID</label>
                                    <p className="text-gray-900 mt-1">{viewModal.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={getStatusVariant(viewModal.status)}>{viewModal.status}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Document Type</label>
                                    <p className="text-gray-900 mt-1">{viewModal.type}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">File Name</label>
                                    <p className="text-gray-900 mt-1 font-mono text-sm">{viewModal.fileName}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Pharmacy</label>
                                    <p className="text-gray-900 mt-1">{viewModal.pharmacy}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Upload Date</label>
                                    <p className="text-gray-900 mt-1">{viewModal.uploadDate}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">File Size</label>
                                    <p className="text-gray-900 mt-1">{viewModal.fileSize}</p>
                                </div>
                                {viewModal.reviewer && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Reviewer</label>
                                            <p className="text-gray-900 mt-1">{viewModal.reviewer}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Review Date</label>
                                            <p className="text-gray-900 mt-1">{viewModal.reviewDate}</p>
                                        </div>
                                    </>
                                )}
                                {viewModal.rejectionReason && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                                        <p className="text-red-600 mt-1 bg-red-50 p-3 rounded">{viewModal.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Document Preview Placeholder */}
                            <div className="border-t border-gray-200 pt-4">
                                <label className="text-sm font-medium text-gray-500 block mb-3">Document Preview</label>
                                <div className="bg-gray-100 rounded-lg p-8 text-center">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm">PDF Preview</p>
                                    <p className="text-gray-500 text-xs mt-1">{viewModal.fileName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => handleDownload(viewModal)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                            <Button variant="primary" onClick={() => setViewModal(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Delete Document</h2>
                            <button onClick={() => setDeleteModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to permanently delete document <strong>{deleteModal.id}</strong>?
                                This action cannot be undone.
                            </p>
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700">
                                    <strong>Warning:</strong> This will remove all associated data and files.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmDelete}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
