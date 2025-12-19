'use client';

import { Building2, Truck, FileText, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/ui/StatCard';
import { ReturnsValueChart } from '@/components/charts/ReturnsValueChart';
import { dashboardStats, recentActivity } from '@/lib/data/dashboard';

export default function Dashboard() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to PharmAdmin Management Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pharmacies"
          value={dashboardStats.totalPharmacies}
          change={dashboardStats.pharmaciesChange}
          icon={<Building2 className="w-6 h-6" />}
          tooltip="Total number of registered pharmacies in the system"
        />
        <StatCard
          title="Active Distributors"
          value={dashboardStats.activeDistributors}
          change={dashboardStats.distributorsChange}
          icon={<Truck className="w-6 h-6" />}
          tooltip="Number of currently active distributors"
        />
        <StatCard
          title="Pending Documents"
          value={dashboardStats.pendingDocuments}
          change={dashboardStats.documentsChange}
          icon={<FileText className="w-6 h-6" />}
          tooltip="Return receipts awaiting approval"
        />
        <StatCard
          title="Returns Value"
          value={dashboardStats.returnsValue}
          change={dashboardStats.returnsChange}
          icon={<DollarSign className="w-6 h-6" />}
          tooltip="Total value of pharmaceutical returns this month"
          isCurrency
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Returns Value Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Returns Value Trend</h2>
          <div className="h-64">
            <ReturnsValueChart />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/pharmacies')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Building2 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Add Pharmacy</p>
          </button>
          <button
            onClick={() => router.push('/documents')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Review Documents</p>
          </button>
          <button
            onClick={() => router.push('/payments')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <DollarSign className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Process Payments</p>
          </button>
          <button
            onClick={() => router.push('/shipments')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Truck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Track Shipments</p>
          </button>
        </div>
      </div>
    </div>
  );
}

