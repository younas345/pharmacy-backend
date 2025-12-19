'use client';

import { useState } from 'react';
import { Search, Eye, Edit, ShoppingCart, Calendar, DollarSign, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

const initialDeals = [
    { id: 'DEAL-001', productName: 'Ibuprofen 200mg', category: 'Pain Relief', quantity: 500, unit: 'bottles', originalPrice: 15.00, dealPrice: 12.00, distributor: 'MediSupply Corp', expiryDate: '2025-06-30', status: 'active', postedDate: '2024-12-10' },
    { id: 'DEAL-002', productName: 'Amoxicillin 500mg', category: 'Antibiotics', quantity: 300, unit: 'bottles', originalPrice: 25.00, dealPrice: 20.00, distributor: 'PharmaDistribute Inc', expiryDate: '2025-08-15', status: 'active', postedDate: '2024-12-12' },
    { id: 'DEAL-003', productName: 'Lisinopril 10mg', category: 'Cardiovascular', quantity: 200, unit: 'bottles', originalPrice: 18.00, dealPrice: 14.00, distributor: 'HealthWholesale LLC', expiryDate: '2025-05-20', status: 'sold', postedDate: '2024-12-08' },
    { id: 'DEAL-004', productName: 'Metformin 1000mg', category: 'Diabetes', quantity: 400, unit: 'bottles', originalPrice: 22.00, dealPrice: 18.00, distributor: 'MediSupply Corp', expiryDate: '2025-07-10', status: 'active', postedDate: '2024-12-14' },
];

type Deal = typeof initialDeals[0];

export default function MarketplacePage() {
    const [deals, setDeals] = useState(initialDeals);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewModal, setViewModal] = useState<Deal | null>(null);
    const [editModal, setEditModal] = useState<Deal | null>(null);
    const [addModal, setAddModal] = useState(false);
    const [newDeal, setNewDeal] = useState({
        productName: '',
        category: '',
        quantity: 0,
        unit: 'bottles',
        originalPrice: 0,
        dealPrice: 0,
        distributor: '',
        expiryDate: '',
        postedDate: new Date().toISOString().split('T')[0]
    });

    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.distributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deal.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || deal.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const calculateSavings = (original: number, deal: number) => {
        return (((original - deal) / original) * 100).toFixed(0);
    };

    const calculateProfit = (original: number, deal: number) => {
        return ((deal / original) * 100).toFixed(0);
    };

    const handleEdit = (deal: Deal) => {
        setDeals(prev => prev.map(d =>
            d.id === deal.id ? deal : d
        ));
        setEditModal(null);
    };

    const handleAddDeal = () => {
        const newId = `DEAL-${String(deals.length + 1).padStart(3, '0')}`;
        const dealToAdd: Deal = {
            id: newId,
            ...newDeal,
            status: 'active'
        };
        setDeals(prev => [...prev, dealToAdd]);
        setAddModal(false);
        // Reset form
        setNewDeal({
            productName: '',
            category: '',
            quantity: 0,
            unit: 'bottles',
            originalPrice: 0,
            dealPrice: 0,
            distributor: '',
            expiryDate: '',
            postedDate: new Date().toISOString().split('T')[0]
        });
    };

    const categories = ['all', ...Array.from(new Set(deals.map(d => d.category)))];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
                <p className="text-gray-600 mt-1">Browse and manage pharmaceutical deals from distributors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Deals</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{deals.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Active Deals</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{deals.filter(d => d.status === 'active').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Sold Deals</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{deals.filter(d => d.status === 'sold').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{deals.reduce((sum, d) => sum + d.quantity, 0)}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="sold">Sold</option>
                        <option value="expired">Expired</option>
                    </select>
                    <Button variant="primary" size="md" onClick={() => setAddModal(true)}>Post New Deal</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDeals.map((deal) => (
                        <div key={deal.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">{deal.productName}</h3>
                                    <p className="text-sm text-gray-600">{deal.id}</p>
                                </div>
                                <Badge variant={deal.status === 'active' ? 'success' : deal.status === 'sold' ? 'info' : 'danger'}>
                                    {deal.status}
                                </Badge>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Package className="w-4 h-4" />
                                    <span>{deal.quantity} {deal.unit}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>{deal.category}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Expires: {deal.expiryDate}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex items-baseline justify-between mb-2">
                                    <span className="text-sm text-gray-600">Original Price:</span>
                                    <span className="text-sm text-gray-500 line-through">{formatCurrency(deal.originalPrice)}</span>
                                </div>
                                <div className="flex items-baseline justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">Deal Price:</span>
                                    <span className="text-lg font-bold text-green-600">{formatCurrency(deal.dealPrice)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-medium">
                                        {calculateSavings(deal.originalPrice, deal.dealPrice)}% savings
                                    </span>
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                                        {calculateProfit(deal.originalPrice, deal.dealPrice)}% margin
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-xs text-gray-500 mb-3">Distributor: {deal.distributor}</p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewModal(deal)}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                    {deal.status === 'active' && (
                                        <Button variant="primary" size="sm" className="flex-1" onClick={() => setEditModal(deal)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredDeals.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No deals found</p>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Deal Details</h2>
                            <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Deal ID</label>
                                    <p className="text-gray-900 mt-1">{viewModal.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={viewModal.status === 'active' ? 'success' : viewModal.status === 'sold' ? 'info' : 'danger'}>
                                            {viewModal.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Product Name</label>
                                    <p className="text-gray-900 mt-1">{viewModal.productName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Category</label>
                                    <p className="text-gray-900 mt-1">{viewModal.category}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Distributor</label>
                                    <p className="text-gray-900 mt-1">{viewModal.distributor}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Quantity</label>
                                    <p className="text-gray-900 mt-1">{viewModal.quantity} {viewModal.unit}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Unit</label>
                                    <p className="text-gray-900 mt-1">{viewModal.unit}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Original Price</label>
                                    <p className="text-gray-900 mt-1">{formatCurrency(viewModal.originalPrice)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Deal Price</label>
                                    <p className="text-green-600 font-semibold mt-1">{formatCurrency(viewModal.dealPrice)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Savings</label>
                                    <p className="text-gray-900 mt-1">{calculateSavings(viewModal.originalPrice, viewModal.dealPrice)}%</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Margin</label>
                                    <p className="text-gray-900 mt-1">{calculateProfit(viewModal.originalPrice, viewModal.dealPrice)}%</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                                    <p className="text-gray-900 mt-1">{viewModal.expiryDate}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Posted Date</label>
                                    <p className="text-gray-900 mt-1">{viewModal.postedDate}</p>
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
                            <h2 className="text-xl font-semibold text-gray-900">Edit Deal</h2>
                            <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                                    <input
                                        type="text"
                                        value={editModal.productName}
                                        onChange={(e) => setEditModal({ ...editModal, productName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <input
                                        type="text"
                                        value={editModal.category}
                                        onChange={(e) => setEditModal({ ...editModal, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Distributor</label>
                                    <input
                                        type="text"
                                        value={editModal.distributor}
                                        onChange={(e) => setEditModal({ ...editModal, distributor: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        value={editModal.quantity}
                                        onChange={(e) => setEditModal({ ...editModal, quantity: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                    <select
                                        value={editModal.unit}
                                        onChange={(e) => setEditModal({ ...editModal, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="bottles">Bottles</option>
                                        <option value="boxes">Boxes</option>
                                        <option value="units">Units</option>
                                        <option value="packs">Packs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editModal.originalPrice}
                                        onChange={(e) => setEditModal({ ...editModal, originalPrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Deal Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editModal.dealPrice}
                                        onChange={(e) => setEditModal({ ...editModal, dealPrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={editModal.expiryDate}
                                        onChange={(e) => setEditModal({ ...editModal, expiryDate: e.target.value })}
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

            {/* Add Deal Modal */}
            {addModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Post New Deal</h2>
                            <button onClick={() => setAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                    <input
                                        type="text"
                                        value={newDeal.productName}
                                        onChange={(e) => setNewDeal({ ...newDeal, productName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Ibuprofen 200mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                    <input
                                        type="text"
                                        value={newDeal.category}
                                        onChange={(e) => setNewDeal({ ...newDeal, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="e.g., Pain Relief"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Distributor *</label>
                                    <input
                                        type="text"
                                        value={newDeal.distributor}
                                        onChange={(e) => setNewDeal({ ...newDeal, distributor: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Distributor name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                    <input
                                        type="number"
                                        value={newDeal.quantity || ''}
                                        onChange={(e) => setNewDeal({ ...newDeal, quantity: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                                    <select
                                        value={newDeal.unit}
                                        onChange={(e) => setNewDeal({ ...newDeal, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="bottles">Bottles</option>
                                        <option value="boxes">Boxes</option>
                                        <option value="units">Units</option>
                                        <option value="packs">Packs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newDeal.originalPrice || ''}
                                        onChange={(e) => setNewDeal({ ...newDeal, originalPrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Deal Price ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newDeal.dealPrice || ''}
                                        onChange={(e) => setNewDeal({ ...newDeal, dealPrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                                    <input
                                        type="date"
                                        value={newDeal.expiryDate}
                                        onChange={(e) => setNewDeal({ ...newDeal, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
                            <Button
                                variant="primary"
                                onClick={handleAddDeal}
                                disabled={!newDeal.productName || !newDeal.category || !newDeal.distributor || newDeal.quantity === 0}
                            >
                                Post Deal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
