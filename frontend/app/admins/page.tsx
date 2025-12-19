'use client';

import { useState } from 'react';
import { Search, Eye, Edit, UserPlus, Trash2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const admins = [
    { id: 'ADM-001', name: 'John Admin', email: 'john@pharmadmin.com', role: 'Super Admin', status: 'active', lastLogin: '2024-12-16 10:30 AM', createdDate: '2024-01-15' },
    { id: 'ADM-002', name: 'Sarah Manager', email: 'sarah@pharmadmin.com', role: 'Manager', status: 'active', lastLogin: '2024-12-16 09:15 AM', createdDate: '2024-02-20' },
    { id: 'ADM-003', name: 'Mike Reviewer', email: 'mike@pharmadmin.com', role: 'Reviewer', status: 'active', lastLogin: '2024-12-15 04:45 PM', createdDate: '2024-03-10' },
    { id: 'ADM-004', name: 'Emily Support', email: 'emily@pharmadmin.com', role: 'Support', status: 'inactive', lastLogin: '2024-12-10 02:30 PM', createdDate: '2024-04-05' },
];

const roleColors: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
    'Super Admin': 'danger',
    'Manager': 'warning',
    'Reviewer': 'info',
    'Support': 'default',
};

export default function AdminsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const roles = ['all', ...Array.from(new Set(admins.map(a => a.role)))];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
                    <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
                </div>
                <Button variant="primary" size="md">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Total Admins</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{admins.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{admins.filter(a => a.status === 'active').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Super Admins</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{admins.filter(a => a.role === 'Super Admin').length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-sm text-gray-600">Reviewers</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{admins.filter(a => a.role === 'Reviewer').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {roles.map(role => (
                            <option key={role} value={role}>{role === 'all' ? 'All Roles' : role}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                {admin.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            {admin.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{admin.email}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={roleColors[admin.role]}>
                                            <Shield className="w-3 h-3 mr-1 inline" />
                                            {admin.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Badge variant={admin.status === 'active' ? 'success' : 'default'}>{admin.status}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{admin.lastLogin}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{admin.createdDate}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {admin.role !== 'Super Admin' && (
                                                <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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

                {filteredAdmins.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No admins found</p>
                    </div>
                )}
            </div>

            {/* Permissions Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <h4 className="font-medium text-red-900 mb-2">Super Admin</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Full system access</li>
                            <li>• Manage all users</li>
                            <li>• System configuration</li>
                            <li>• All permissions</li>
                        </ul>
                    </div>
                    <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <h4 className="font-medium text-yellow-900 mb-2">Manager</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Manage pharmacies</li>
                            <li>• Approve documents</li>
                            <li>• Process payments</li>
                            <li>• View analytics</li>
                        </ul>
                    </div>
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h4 className="font-medium text-blue-900 mb-2">Reviewer</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Review documents</li>
                            <li>• Approve/reject returns</li>
                            <li>• View shipments</li>
                            <li>• Limited access</li>
                        </ul>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Support</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• View-only access</li>
                            <li>• Customer support</li>
                            <li>• Answer queries</li>
                            <li>• Generate reports</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
