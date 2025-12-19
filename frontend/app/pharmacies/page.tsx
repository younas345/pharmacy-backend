'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Ban, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Mock data
const initialPharmacies = [
    { id: 'PHM-001', businessName: 'HealthFirst Pharmacy', owner: 'John Smith', email: 'john@healthfirst.com', phone: '(555) 123-4567', city: 'New York', state: 'NY', status: 'active', totalReturns: 45, address: '123 Main St', zipCode: '10001', licenseNumber: 'NY-12345' },
    { id: 'PHM-002', businessName: 'City Care Pharmacy', owner: 'Sarah Johnson', email: 'sarah@citycare.com', phone: '(555) 234-5678', city: 'Los Angeles', state: 'CA', status: 'active', totalReturns: 38, address: '456 Oak Ave', zipCode: '90001', licenseNumber: 'CA-67890' },
    { id: 'PHM-003', businessName: 'MedPlus Pharmacy', owner: 'Michael Brown', email: 'michael@medplus.com', phone: '(555) 345-6789', city: 'Chicago', state: 'IL', status: 'suspended', totalReturns: 22, address: '789 Elm St', zipCode: '60601', licenseNumber: 'IL-24680' },
    { id: 'PHM-004', businessName: 'QuickMed Pharmacy', owner: 'Emily Davis', email: 'emily@quickmed.com', phone: '(555) 456-7890', city: 'Houston', state: 'TX', status: 'blacklisted', totalReturns: 15, address: '321 Pine Rd', zipCode: '77001', licenseNumber: 'TX-13579' },
];

type Pharmacy = typeof initialPharmacies[0];

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState(initialPharmacies);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewModal, setViewModal] = useState<Pharmacy | null>(null);
    const [editModal, setEditModal] = useState<Pharmacy | null>(null);
    const [blacklistModal, setBlacklistModal] = useState<Pharmacy | null>(null);
    const [restoreModal, setRestoreModal] = useState<Pharmacy | null>(null);

    const filteredPharmacies = pharmacies.filter(pharmacy => {
        const matchesSearch = pharmacy.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pharmacy.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pharmacy.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || pharmacy.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleBlacklist = (pharmacy: Pharmacy) => {
        setPharmacies(prev => prev.map(p =>
            p.id === pharmacy.id ? { ...p, status: 'blacklisted' } : p
        ));
        setBlacklistModal(null);
    };

    const handleRestore = (pharmacy: Pharmacy) => {
        setPharmacies(prev => prev.map(p =>
            p.id === pharmacy.id ? { ...p, status: 'active' } : p
        ));
        setRestoreModal(null);
    };

    const handleEdit = (pharmacy: Pharmacy) => {
        setPharmacies(prev => prev.map(p =>
            p.id === pharmacy.id ? pharmacy : p
        ));
        setEditModal(null);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'suspended': return 'warning';
            case 'blacklisted': return 'danger';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacies</h1>
                <p className="text-gray-600 mt-1">Manage registered pharmacies</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search pharmacies..."
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
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blacklisted">Blacklisted</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Returns</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPharmacies.map((pharmacy) => (
                                <tr key={pharmacy.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pharmacy.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pharmacy.businessName}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{pharmacy.owner}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div>{pharmacy.email}</div>
                                        <div className="text-gray-500">{pharmacy.phone}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{pharmacy.city}, {pharmacy.state}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={getStatusVariant(pharmacy.status)}>{pharmacy.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pharmacy.totalReturns}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewModal(pharmacy)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditModal(pharmacy)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {pharmacy.status === 'active' ? (
                                                <button
                                                    onClick={() => setBlacklistModal(pharmacy)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Blacklist"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            ) : pharmacy.status === 'blacklisted' ? (
                                                <button
                                                    onClick={() => setRestoreModal(pharmacy)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Restore"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPharmacies.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No pharmacies found</p>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Pharmacy Details</h2>
                            <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Pharmacy ID</label>
                                    <p className="text-gray-900 mt-1">{viewModal.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={getStatusVariant(viewModal.status)}>{viewModal.status}</Badge>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                                    <p className="text-gray-900 mt-1">{viewModal.businessName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Owner Name</label>
                                    <p className="text-gray-900 mt-1">{viewModal.owner}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">License Number</label>
                                    <p className="text-gray-900 mt-1">{viewModal.licenseNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900 mt-1">{viewModal.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone</label>
                                    <p className="text-gray-900 mt-1">{viewModal.phone}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Address</label>
                                    <p className="text-gray-900 mt-1">{viewModal.address}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">City</label>
                                    <p className="text-gray-900 mt-1">{viewModal.city}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">State</label>
                                    <p className="text-gray-900 mt-1">{viewModal.state}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                                    <p className="text-gray-900 mt-1">{viewModal.zipCode}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Returns</label>
                                    <p className="text-gray-900 mt-1">{viewModal.totalReturns}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setViewModal(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Edit Pharmacy</h2>
                            <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                                    <input
                                        type="text"
                                        value={editModal.businessName}
                                        onChange={(e) => setEditModal({ ...editModal, businessName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                                    <input
                                        type="text"
                                        value={editModal.owner}
                                        onChange={(e) => setEditModal({ ...editModal, owner: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                                    <input
                                        type="text"
                                        value={editModal.licenseNumber}
                                        onChange={(e) => setEditModal({ ...editModal, licenseNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={editModal.email}
                                        onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={editModal.phone}
                                        onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={editModal.address}
                                        onChange={(e) => setEditModal({ ...editModal, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={editModal.city}
                                        onChange={(e) => setEditModal({ ...editModal, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={editModal.state}
                                        onChange={(e) => setEditModal({ ...editModal, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                    <input
                                        type="text"
                                        value={editModal.zipCode}
                                        onChange={(e) => setEditModal({ ...editModal, zipCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
                            <Button variant="primary" onClick={() => handleEdit(editModal)}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blacklist Confirmation Modal */}
            {blacklistModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Blacklist Pharmacy</h2>
                            <button onClick={() => setBlacklistModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to blacklist <strong>{blacklistModal.businessName}</strong>?
                                This will prevent them from accessing the platform.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setBlacklistModal(null)}>Cancel</Button>
                            <Button variant="danger" onClick={() => handleBlacklist(blacklistModal)}>Blacklist</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {restoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Restore Pharmacy</h2>
                            <button onClick={() => setRestoreModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to restore <strong>{restoreModal.businessName}</strong>?
                                This will reactivate their access to the platform.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setRestoreModal(null)}>Cancel</Button>
                            <Button variant="success" onClick={() => handleRestore(restoreModal)}>Restore</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
