'use client';

import { useState } from 'react';
import { Search, Eye, DollarSign, RefreshCw, Download, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

// Mock data
const initialPayments = [
    { id: 'PAY-5001', pharmacy: 'HealthFirst Pharmacy', amount: 15850.00, status: 'Completed', date: '2024-12-15', method: 'Bank Transfer', transactionId: 'TXN-2024-001', processedBy: 'System' as string | undefined, failureReason: undefined as string | undefined },
    { id: 'PAY-5002', pharmacy: 'City Care Pharmacy', amount: 8420.50, status: 'Pending', date: '2024-12-14', method: 'Check', transactionId: 'TXN-2024-002', processedBy: undefined as string | undefined, failureReason: undefined as string | undefined },
    { id: 'PAY-5003', pharmacy: 'MedPlus Pharmacy', amount: 12680.00, status: 'Processing', date: '2024-12-13', method: 'Bank Transfer', transactionId: 'TXN-2024-003', processedBy: undefined as string | undefined, failureReason: undefined as string | undefined },
    { id: 'PAY-5004', pharmacy: 'HealthFirst Pharmacy', amount: 9340.75, status: 'Failed', date: '2024-12-12', method: 'Bank Transfer', transactionId: 'TXN-2024-004', processedBy: undefined as string | undefined, failureReason: 'Insufficient funds' as string | undefined },
    { id: 'PAY-5005', pharmacy: 'QuickMed Pharmacy', amount: 5290.00, status: 'Completed', date: '2024-12-11', method: 'Check', transactionId: 'TXN-2024-005', processedBy: 'Admin User' as string | undefined, failureReason: undefined as string | undefined },
    { id: 'PAY-5006', pharmacy: 'City Care Pharmacy', amount: 11750.25, status: 'Completed', date: '2024-12-10', method: 'Bank Transfer', transactionId: 'TXN-2024-006', processedBy: 'System' as string | undefined, failureReason: undefined as string | undefined },
];

type Payment = typeof initialPayments[0];

export default function PaymentsPage() {
    const [payments, setPayments] = useState(initialPayments);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewModal, setViewModal] = useState<Payment | null>(null);
    const [processModal, setProcessModal] = useState<Payment | null>(null);
    const [retryModal, setRetryModal] = useState<Payment | null>(null);

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Pending': return 'warning';
            case 'Processing': return 'info';
            case 'Failed': return 'danger';
            default: return 'default';
        }
    };

    const handleProcessPayment = (payment: Payment) => {
        setPayments(prev => prev.map(p =>
            p.id === payment.id
                ? { ...p, status: 'Completed', processedBy: 'Admin User' }
                : p
        ));
        setProcessModal(null);
    };

    const handleRetryPayment = (payment: Payment) => {
        setPayments(prev => prev.map(p =>
            p.id === payment.id
                ? { ...p, status: 'Processing', failureReason: undefined }
                : p
        ));
        setRetryModal(null);
    };

    const handleDownload = (payment: Payment) => {
        console.log('Downloading receipt for:', payment.id);
        alert(`Downloading receipt for ${payment.id}...`);
    };

    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600 mt-1">Manage pharmacy payments and transactions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{filteredPayments.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{payments.filter(p => p.status === 'Completed').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{payments.filter(p => p.status === 'Failed').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search payments..."
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
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{payment.pharmacy}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{payment.date}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{payment.method}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{payment.transactionId}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewModal(payment)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {payment.status === 'Pending' && (
                                                <button
                                                    onClick={() => setProcessModal(payment)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Process Payment"
                                                >
                                                    <DollarSign className="w-4 h-4" />
                                                </button>
                                            )}
                                            {payment.status === 'Failed' && (
                                                <button
                                                    onClick={() => setRetryModal(payment)}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    title="Retry Payment"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                            {payment.status === 'Completed' && (
                                                <button
                                                    onClick={() => handleDownload(payment)}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                    title="Download Receipt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No payments found</p>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                            <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment ID</label>
                                    <p className="text-gray-900 mt-1">{viewModal.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={getStatusVariant(viewModal.status)}>{viewModal.status}</Badge>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Pharmacy</label>
                                    <p className="text-gray-900 mt-1">{viewModal.pharmacy}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-gray-900 font-semibold text-lg mt-1">{formatCurrency(viewModal.amount)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Date</label>
                                    <p className="text-gray-900 mt-1">{viewModal.date}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                                    <p className="text-gray-900 mt-1">{viewModal.method}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                                    <p className="text-gray-900 mt-1 font-mono text-sm">{viewModal.transactionId}</p>
                                </div>
                                {viewModal.processedBy && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Processed By</label>
                                        <p className="text-gray-900 mt-1">{viewModal.processedBy}</p>
                                    </div>
                                )}
                                {viewModal.failureReason && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Failure Reason</label>
                                        <p className="text-red-600 mt-1 bg-red-50 p-3 rounded">{viewModal.failureReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            {viewModal.status === 'Completed' && (
                                <Button variant="outline" onClick={() => handleDownload(viewModal)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Receipt
                                </Button>
                            )}
                            <Button variant="primary" onClick={() => setViewModal(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Process Payment Modal */}
            {processModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
                            <button onClick={() => setProcessModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to process payment <strong>{processModal.id}</strong>?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Pharmacy:</span>
                                    <span className="text-sm font-medium text-gray-900">{processModal.pharmacy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Amount:</span>
                                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(processModal.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Method:</span>
                                    <span className="text-sm text-gray-900">{processModal.method}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setProcessModal(null)}>Cancel</Button>
                            <Button variant="success" onClick={() => handleProcessPayment(processModal)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Process Payment
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Retry Payment Modal */}
            {retryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Retry Payment</h2>
                            <button onClick={() => setRetryModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Would you like to retry payment <strong>{retryModal.id}</strong>?
                            </p>
                            {retryModal.failureReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-red-700">
                                        <strong>Previous failure:</strong> {retryModal.failureReason}
                                    </p>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Pharmacy:</span>
                                    <span className="text-sm font-medium text-gray-900">{retryModal.pharmacy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Amount:</span>
                                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(retryModal.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Method:</span>
                                    <span className="text-sm text-gray-900">{retryModal.method}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setRetryModal(null)}>Cancel</Button>
                            <Button variant="warning" onClick={() => handleRetryPayment(retryModal)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Payment
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
