'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Ban, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const initialDistributors = [
    { id: 'DIST-001', companyName: 'MediSupply Corp', contactPerson: 'Robert Wilson', email: 'robert@medisupply.com', phone: '(555) 111-2222', city: 'Boston', state: 'MA', status: 'active', totalDeals: 28, specializations: ['Antibiotics', 'Pain Relief'], address: '100 Medical Plaza', zipCode: '02101', licenseNumber: 'MA-DIST-001' },
    { id: 'DIST-002', companyName: 'PharmaDistribute Inc', contactPerson: 'Lisa Anderson', email: 'lisa@pharmadist.com', phone: '(555) 222-3333', city: 'Seattle', state: 'WA', status: 'active', totalDeals: 35, specializations: ['Cardiovascular', 'Diabetes'], address: '200 Distribution Way', zipCode: '98101', licenseNumber: 'WA-DIST-002' },
    { id: 'DIST-003', companyName: 'HealthWholesale LLC', contactPerson: 'James Miller', email: 'james@healthwholesale.com', phone: '(555) 333-4444', city: 'Denver', state: 'CO', status: 'inactive', totalDeals: 12, specializations: ['Vitamins', 'Supplements'], address: '300 Wholesale Blvd', zipCode: '80201', licenseNumber: 'CO-DIST-003' },
];

type Distributor = typeof initialDistributors[0];

export default function DistributorsPage() {
    const [distributors, setDistributors] = useState(initialDistributors);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewModal, setViewModal] = useState<Distributor | null>(null);
    const [editModal, setEditModal] = useState<Distributor | null>(null);
    const [deactivateModal, setDeactivateModal] = useState<Distributor | null>(null);
    const [activateModal, setActivateModal] = useState<Distributor | null>(null);
    const [addModal, setAddModal] = useState(false);
    const [newDistributor, setNewDistributor] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        licenseNumber: '',
        specializations: [] as string[]
    });

    const filteredDistributors = distributors.filter(distributor => {
        const matchesSearch = distributor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            distributor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
            distributor.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || distributor.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDeactivate = (distributor: Distributor) => {
        setDistributors(prev => prev.map(d =>
            d.id === distributor.id ? { ...d, status: 'inactive' } : d
        ));
        setDeactivateModal(null);
    };

    const handleActivate = (distributor: Distributor) => {
        setDistributors(prev => prev.map(d =>
            d.id === distributor.id ? { ...d, status: 'active' } : d
        ));
        setActivateModal(null);
    };

    const handleEdit = (distributor: Distributor) => {
        setDistributors(prev => prev.map(d =>
            d.id === distributor.id ? distributor : d
        ));
        setEditModal(null);
    };

    const handleAddDistributor = () => {
        const newId = `DIST-${String(distributors.length + 1).padStart(3, '0')}`;
        const distributorToAdd: Distributor = {
            id: newId,
            ...newDistributor,
            status: 'active',
            totalDeals: 0
        };
        setDistributors(prev => [...prev, distributorToAdd]);
        setAddModal(false);
        // Reset form
        setNewDistributor({
            companyName: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            licenseNumber: '',
            specializations: []
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Distributors</h1>
                <p className="text-gray-600 mt-1">Manage reverse distributors and their deals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Distributors</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{distributors.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{distributors.filter(d => d.status === 'active').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Deals</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{distributors.reduce((sum, d) => sum + d.totalDeals, 0)}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search distributors..."
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
                        <option value="inactive">Inactive</option>
                    </select>
                    <Button variant="primary" size="md" onClick={() => setAddModal(true)}>Add Distributor</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specializations</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deals</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDistributors.map((distributor) => (
                                <tr key={distributor.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{distributor.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.companyName}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{distributor.contactPerson}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div>{distributor.email}</div>
                                        <div className="text-gray-500">{distributor.phone}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{distributor.city}, {distributor.state}</td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        <div className="flex flex-wrap gap-1">
                                            {distributor.specializations.map((spec, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{spec}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{distributor.totalDeals}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={distributor.status === 'active' ? 'success' : 'default'}>{distributor.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setViewModal(distributor)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditModal(distributor)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {distributor.status === 'active' ? (
                                                <button
                                                    onClick={() => setDeactivateModal(distributor)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Deactivate"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setActivateModal(distributor)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Activate"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredDistributors.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No distributors found</p>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Distributor Details</h2>
                            <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Distributor ID</label>
                                    <p className="text-gray-900 mt-1">{viewModal.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={viewModal.status === 'active' ? 'success' : 'default'}>{viewModal.status}</Badge>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                                    <p className="text-gray-900 mt-1">{viewModal.companyName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                                    <p className="text-gray-900 mt-1">{viewModal.contactPerson}</p>
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
                                    <label className="text-sm font-medium text-gray-500">Total Deals</label>
                                    <p className="text-gray-900 mt-1">{viewModal.totalDeals}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Specializations</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {viewModal.specializations.map((spec, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{spec}</span>
                                        ))}
                                    </div>
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
                            <h2 className="text-xl font-semibold text-gray-900">Edit Distributor</h2>
                            <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        value={editModal.companyName}
                                        onChange={(e) => setEditModal({ ...editModal, companyName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                                    <input
                                        type="text"
                                        value={editModal.contactPerson}
                                        onChange={(e) => setEditModal({ ...editModal, contactPerson: e.target.value })}
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
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Specializations (comma separated)</label>
                                    <input
                                        type="text"
                                        value={editModal.specializations.join(', ')}
                                        onChange={(e) => setEditModal({
                                            ...editModal,
                                            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Antibiotics, Pain Relief, Cardiovascular"
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

            {/* Deactivate Confirmation Modal */}
            {deactivateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Deactivate Distributor</h2>
                            <button onClick={() => setDeactivateModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to deactivate <strong>{deactivateModal.companyName}</strong>?
                                This will temporarily suspend their access and deals.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setDeactivateModal(null)}>Cancel</Button>
                            <Button variant="danger" onClick={() => handleDeactivate(deactivateModal)}>Deactivate</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activate Confirmation Modal */}
            {activateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Activate Distributor</h2>
                            <button onClick={() => setActivateModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to activate <strong>{activateModal.companyName}</strong>?
                                This will restore their access and allow them to create deals.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setActivateModal(null)}>Cancel</Button>
                            <Button variant="success" onClick={() => handleActivate(activateModal)}>Activate</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Distributor Modal */}
            {addModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Add New Distributor</h2>
                            <button onClick={() => setAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.companyName}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, companyName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.contactPerson}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, contactPerson: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter contact person name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.licenseNumber}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, licenseNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., MA-DIST-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={newDistributor.email}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={newDistributor.phone}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.address}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter street address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.city}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter city"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.state}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., CA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.zipCode}
                                        onChange={(e) => setNewDistributor({ ...newDistributor, zipCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Enter ZIP code"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Specializations (comma separated) *</label>
                                    <input
                                        type="text"
                                        value={newDistributor.specializations.join(', ')}
                                        onChange={(e) => setNewDistributor({
                                            ...newDistributor,
                                            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Antibiotics, Pain Relief, Cardiovascular"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
                            <Button
                                variant="primary"
                                onClick={handleAddDistributor}
                                disabled={!newDistributor.companyName || !newDistributor.contactPerson || !newDistributor.email}
                            >
                                Add Distributor
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
