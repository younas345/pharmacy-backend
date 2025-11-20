"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Search,
  Download,
  Filter,
  DollarSign,
  Building2,
  Package,
} from 'lucide-react';
import { mockPriceComparisons } from '@/data/mockPricing';
import { formatCurrency } from '@/lib/utils/format';

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState<string>('all');

  const filteredComparisons = mockPriceComparisons.filter(comp =>
    comp.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.ndc.includes(searchQuery)
  );

  const allDistributors = Array.from(
    new Set(
      mockPriceComparisons.flatMap(comp =>
        comp.distributorPrices.map(p => p.distributorName)
      )
    )
  );

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-xs text-gray-600 mt-0.5">Price comparisons and market insights</p>
          </div>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-0">
            <Download className="mr-1 h-3 w-3" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-2 border-teal-200">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-500" />
                <Input
                  placeholder="Search by NDC or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm"
              >
                <option value="all">All Distributors</option>
                {allDistributors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="mr-1 h-3 w-3" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Comparisons */}
        <div className="space-y-3">
          {filteredComparisons.length === 0 ? (
            <Card className="border-2 border-teal-200">
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No price comparisons found</p>
              </CardContent>
            </Card>
          ) : (
            filteredComparisons.map((comparison, idx) => (
              <Card key={idx} className="border-2 border-teal-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{comparison.productName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        NDC: <span className="font-mono">{comparison.ndc}</span> • {comparison.manufacturer}
                      </p>
                    </div>
                    <Badge variant="success" className="text-xs">
                      Best: {comparison.bestDistributor.distributorName}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Distributor Price Comparison */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {comparison.distributorPrices.map((distPrice, distIdx) => {
                        const isBest = distPrice.distributorId === comparison.bestDistributor.distributorId;
                        const priceDiff = distPrice.averagePricePerUnit - comparison.bestDistributor.pricePerUnit;
                        
                        return (
                          <div
                            key={distIdx}
                            className={`p-3 rounded-lg border-2 ${
                              isBest
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold">{distPrice.distributorName}</p>
                              {isBest && (
                                <Badge variant="success" className="text-xs">Best</Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Avg Price:</span>
                                <span className="text-sm font-bold text-emerald-700">
                                  {formatCurrency(distPrice.averagePricePerUnit)}/unit
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Range:</span>
                                <span className="text-xs text-gray-700">
                                  {formatCurrency(distPrice.minPrice)} - {formatCurrency(distPrice.maxPrice)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Data Points:</span>
                                <span className="text-xs font-medium">{distPrice.dataPoints}</span>
                              </div>
                              {!isBest && (
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">
                                    {formatCurrency(Math.abs(priceDiff))} less per unit
                                  </span>
                                </div>
                              )}
                              {isBest && (
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-emerald-200">
                                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                                  <span className="text-xs text-emerald-600 font-medium">
                                    Best price available
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Recommendation</p>
                          <p className="text-sm text-blue-800">{comparison.recommendation}</p>
                          <p className="text-xs text-blue-700 mt-2">
                            Potential savings: {formatCurrency(comparison.bestDistributor.savings)} per unit
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="border-2 border-teal-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-teal-600" />
                <p className="text-xs font-medium text-teal-700">Products Analyzed</p>
              </div>
              <p className="text-xl font-bold text-teal-900">{filteredComparisons.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-cyan-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-cyan-600" />
                <p className="text-xs font-medium text-cyan-700">Distributors</p>
              </div>
              <p className="text-xl font-bold text-cyan-900">{allDistributors.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700">Avg Price Variance</p>
              </div>
              <p className="text-xl font-bold text-emerald-900">8.5%</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-700">Potential Savings</p>
              </div>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(
                  filteredComparisons.reduce(
                    (sum, comp) => sum + comp.bestDistributor.savings,
                    0
                  )
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

