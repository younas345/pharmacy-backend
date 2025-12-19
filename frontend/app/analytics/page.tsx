'use client';

import { DollarSign, TrendingUp, Package, Building2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ReturnsValueTrendChart } from '@/components/charts/ReturnsValueTrendChart';
import { ReturnsByCategoryChart } from '@/components/charts/ReturnsByCategoryChart';

const stateBreakdown = [
    { state: 'California', pharmacies: 45, totalReturns: 1245, avgReturnValue: 12500 },
    { state: 'New York', pharmacies: 38, totalReturns: 987, avgReturnValue: 11200 },
    { state: 'Texas', pharmacies: 42, totalReturns: 1103, avgReturnValue: 10800 },
    { state: 'Florida', pharmacies: 35, totalReturns: 845, avgReturnValue: 9500 },
    { state: 'Illinois', pharmacies: 28, totalReturns: 678, avgReturnValue: 8900 },
];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">Insights and statistics for pharmaceutical returns</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Total Returns Value</p>
                        <DollarSign className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(2456890)}</p>
                    <p className="text-sm text-green-600 mt-2">↑ 15.8% vs last month</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Total Returns</p>
                        <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(4858)}</p>
                    <p className="text-sm text-green-600 mt-2">↑ 8.3% vs last month</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Avg Return Value</p>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(505.67)}</p>
                    <p className="text-sm text-green-600 mt-2">↑ 6.9% vs last month</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Active Pharmacies</p>
                        <Building2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(248)}</p>
                    <p className="text-sm text-green-600 mt-2">↑ 12.5% vs last month</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Returns Value Trend</h2>
                    <div className="h-64">
                        <ReturnsValueTrendChart />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Returns by Category</h2>
                    <div className="h-64">
                        <ReturnsByCategoryChart />
                    </div>
                </div>
            </div>

            {/* State Breakdown Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">State Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacies</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Returns</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Return Value</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stateBreakdown.map((state) => (
                                <tr key={state.state} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{state.state}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{state.pharmacies}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatNumber(state.totalReturns)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(state.avgReturnValue)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {formatCurrency(state.totalReturns * state.avgReturnValue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Processing Time</h3>
                    <p className="text-2xl font-bold text-gray-900">2.3 days</p>
                    <p className="text-sm text-gray-500 mt-1">Average document approval time</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Approval Rate</h3>
                    <p className="text-2xl font-bold text-gray-900">94.5%</p>
                    <p className="text-sm text-gray-500 mt-1">Documents approved on first submission</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Payment Success</h3>
                    <p className="text-2xl font-bold text-gray-900">98.2%</p>
                    <p className="text-sm text-gray-500 mt-1">Successful payment transactions</p>
                </div>
            </div>
        </div>
    );
}
