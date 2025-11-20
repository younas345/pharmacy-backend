"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react';
import { dashboardService, documentsService } from '@/lib/api/services';
import type { DashboardSummary } from '@/lib/api/services';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, docsResult] = await Promise.all([
        dashboardService.getSummary(),
        documentsService.getDocuments({ limit: 5 }),
      ]);
      setSummary(summaryData);
      setRecentDocuments(docsResult.documents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'failed': return 'error';
      case 'needs_review': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading || !summary) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-xs text-gray-600 mt-0.5">Maximize your returns with data-driven insights</p>
          </div>
          <Link href="/upload">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              <Upload className="mr-1 h-3 w-3" />
              Upload Documents
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <Link href="/documents">
            <div className="p-3 rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3 text-teal-600" />
                <p className="text-xs text-teal-700 font-medium">Documents</p>
              </div>
              <p className="text-xl font-bold text-teal-900">{summary.totalDocuments}</p>
            </div>
          </Link>
          <Link href="/reports">
            <div className="p-3 rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-cyan-600" />
                <p className="text-xs text-cyan-700 font-medium">Distributors</p>
              </div>
              <p className="text-xl font-bold text-cyan-900">{summary.totalDistributors}</p>
            </div>
          </Link>
          <Link href="/products">
            <div className="p-3 rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <Package className="h-3 w-3 text-emerald-600" />
                <p className="text-xs text-emerald-700 font-medium">NDC Codes</p>
              </div>
              <p className="text-xl font-bold text-emerald-900">{summary.totalNDCs}</p>
            </div>
          </Link>
          <Link href="/reports">
            <div className="p-3 rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="h-3 w-3 text-amber-600" />
                <p className="text-xs text-amber-700 font-medium">Data Points</p>
              </div>
              <p className="text-xl font-bold text-amber-900">{summary.totalDataPoints}</p>
            </div>
          </Link>
          <Link href="/returns">
            <div className="p-3 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <Package className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-700 font-medium">Total Returns</p>
              </div>
              <p className="text-lg font-bold text-blue-900">{summary.totalReturns}</p>
            </div>
          </Link>
          <Link href="/returns?status=pending">
            <div className="p-3 rounded-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-orange-600" />
                <p className="text-xs text-orange-700 font-medium">Pending Returns</p>
              </div>
              <p className="text-xl font-bold text-orange-900">{summary.pendingReturns}</p>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Recommendations */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900">Top Recommendations</h3>
                </div>
                <Link href="/optimization">
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-700 hover:text-emerald-900">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Active Inventory Items</p>
                    <p className="text-2xl font-bold text-emerald-900">{summary.activeInventory}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-100">
                    <Link href="/inventory">
                      <Button variant="ghost" size="sm" className="w-full text-xs text-emerald-700 hover:text-emerald-900">
                        View Inventory
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
                {summary.expiringItems > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-semibold text-amber-900">Items Expiring Soon</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{summary.expiringItems}</p>
                    <div className="pt-2 border-t border-amber-100 mt-2">
                      <Link href="/inventory?status=expiring_soon">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-amber-700 hover:text-amber-900">
                          Review Items
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900">Recent Documents</h3>
                </div>
                <Link href="/documents">
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-teal-700 hover:text-teal-900">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {recentDocuments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-xs">No documents yet</div>
                ) : (
                  recentDocuments.map((doc) => (
                    <div key={doc.id} className="p-2 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-600">{doc.reverseDistributorName}</p>
                        </div>
                        <Badge variant={getStatusVariant(doc.status)} className="text-xs border-2 ml-2">
                          {getStatusLabel(doc.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                        <span>{doc.extractedItems} items</span>
                        {doc.totalCreditAmount && (
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(doc.totalCreditAmount)}
                          </span>
                        )}
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-teal-100">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="font-bold text-base text-teal-900">Document Activity</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-teal-700 font-medium">Total Documents:</span>
                  <span className="font-bold text-teal-900">{summary.totalDocuments}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-teal-700 font-medium">This Month:</span>
                  <span className="font-bold text-cyan-700">{summary.documentsThisMonth}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-teal-700 font-medium">Last Upload:</span>
                  <span className="font-bold text-teal-900">
                    {summary.lastUploadDate ? formatDate(summary.lastUploadDate) : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-base text-emerald-900">Data Insights</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-emerald-700 font-medium">Total NDC Codes:</span>
                  <span className="font-bold text-emerald-900">{summary.totalNDCs}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-emerald-700 font-medium">Data Points:</span>
                  <span className="font-bold text-emerald-900">{summary.totalDataPoints}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-emerald-700 font-medium">Price Variance:</span>
                  <span className="font-bold text-amber-700">{summary.averagePriceVariance}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-100">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-base text-purple-900">Optimization</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-purple-700 font-medium">Potential Savings:</span>
                  <span className="font-bold text-lg text-purple-900">
                    {formatCurrency(summary.potentialSavings)}
                  </span>
                </div>
                <div className="flex justify-between p-1.5 rounded bg-white/50">
                  <span className="text-purple-700 font-medium">Distributors Tracked:</span>
                  <span className="font-bold text-purple-900">{summary.totalDistributors}</span>
                </div>
                <Link href="/optimization">
                  <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50">
                    View Recommendations
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
