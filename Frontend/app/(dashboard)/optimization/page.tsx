"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Download,
  RefreshCw,
  DollarSign,
  Package,
  Info,
  Calendar,
  Target,
  Sparkles,
  ArrowUp,
  X,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { mockOptimizationRecommendation } from '@/data/mockAnalytics';
import { mockDistributors } from '@/data/mockDistributors';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default function OptimizationPage() {
  const recommendation = mockOptimizationRecommendation;
  
  // Track which distributors have been used this month (mock data - in production from API)
  const [usedDistributorsThisMonth] = useState<Set<string>>(new Set(['1', '2'])); // Example: ABC and XYZ used
  
  // Track which product's analysis is being viewed
  const [selectedAnalysis, setSelectedAnalysis] = useState<typeof recommendation.recommendations[0] | null>(null);
  
  // Calculate monthly analytics
  const totalDistributors = mockDistributors.length;
  const distributorsUsed = usedDistributorsThisMonth.size;
  const distributorsAvailable = totalDistributors - distributorsUsed;
  
  // Calculate earnings scenarios
  // Single distributor: using only the best recommended distributor
  const singleDistributorEarnings = recommendation.totalPotentialSavings;
  
  // Multiple distributors: if using available distributors, could potentially earn more
  // This is a simplified calculation - in production, this would be based on actual pricing data
  const multipleDistributorEarnings = singleDistributorEarnings * 1.35; // Example: 35% more with multiple distributors
  const potentialAdditionalEarnings = multipleDistributorEarnings - singleDistributorEarnings;

  const handleGenerateNew = () => {
    alert('Generating new optimization recommendations...');
  };

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Optimization Recommendations</h1>
            <p className="text-xs text-gray-600 mt-0.5">Maximize your returns with data-driven recommendations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNew}
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Generate New
            </Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              <Download className="mr-1 h-3 w-3" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Monthly Rule Info Banner */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Monthly Distribution Rule
                </p>
                <p className="text-xs text-blue-800">
                  You can work with each distributor <strong>once per month</strong>. 
                  Use multiple distributors to maximize your returns and earn more money!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-2 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Used This Month</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {distributorsUsed}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    of {totalDistributors} total
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-teal-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Still Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {distributorsAvailable}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    distributors this month
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Maximize Earnings</p>
                  <p className="text-sm font-bold text-yellow-700">
                    Use multiple distributors
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    to earn more money
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Single Distributor Strategy
              </CardTitle>
              <CardDescription>Using only the best recommended distributor</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-700">
                {formatCurrency(singleDistributorEarnings)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Based on current recommendations
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Multiple Distributors Strategy
              </CardTitle>
              <CardDescription>Using available distributors this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-700">
                  {formatCurrency(multipleDistributorEarnings)}
                </p>
                {potentialAdditionalEarnings > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      +{formatCurrency(potentialAdditionalEarnings)} potential additional earnings
                    </span>
                  </div>
                )}
                <p className="text-xs text-green-700 mt-2">
                  By using {distributorsAvailable} available distributors this month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium mb-1">Total Potential Savings</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {formatCurrency(recommendation.totalPotentialSavings)}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Based on {recommendation.recommendations.length} product recommendations
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border-2 border-emerald-200">
                <TrendingUp className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <p className="text-xs text-emerald-700">
                Generated: {formatDate(recommendation.generatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How to Maximize Earnings Guide */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              How to Maximize Your Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Review Recommendations</p>
                  <p className="text-blue-700 text-xs">Check the recommended distributors for each product below</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Check Monthly Availability</p>
                  <p className="text-blue-700 text-xs">Make sure you haven't used the distributor this month (see badges below)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Use Multiple Distributors</p>
                  <p className="text-blue-700 text-xs">Distribute your products across different available distributors to maximize total earnings</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">4</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Track Monthly Usage</p>
                  <p className="text-blue-700 text-xs">Remember: Each distributor can only be used once per month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Product Recommendations</h2>
          {recommendation.recommendations.map((rec, idx) => (
            <Card key={idx} className="border-2 border-teal-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{rec.productName}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      NDC: <span className="font-mono">{rec.ndc}</span>
                    </p>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Save {formatCurrency(rec.savings)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recommended Distributor */}
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-900">Recommended Distributor</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-emerald-900">
                            {rec.recommendedDistributor}
                          </p>
                          {/* Check if distributor is used this month */}
                          {(() => {
                            const distributor = mockDistributors.find(d => d.name === rec.recommendedDistributor);
                            const usedThisMonth = distributor && usedDistributorsThisMonth.has(distributor.id);
                            return usedThisMonth ? (
                              <Badge variant="warning" className="text-xs">
                                Used This Month
                              </Badge>
                            ) : (
                              <Badge variant="info" className="text-xs">
                                Available
                              </Badge>
                            );
                          })()}
                        </div>
                        <p className="text-sm text-emerald-700 mt-1">
                          Expected Price: {formatCurrency(rec.expectedPrice)} per unit
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-600">Potential Savings</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {formatCurrency(rec.savings)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alternative Distributors */}
                  {rec.alternativeDistributors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Alternative Options:</p>
                      <div className="space-y-2">
                        {rec.alternativeDistributors.map((alt, altIdx) => {
                          const distributor = mockDistributors.find(d => d.name === alt.name);
                          const usedThisMonth = distributor && usedDistributorsThisMonth.has(distributor.id);
                          return (
                            <div
                              key={altIdx}
                              className={`flex items-center justify-between p-2 rounded border ${
                                usedThisMonth 
                                  ? 'bg-gray-100 border-gray-300 opacity-75' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-medium ${
                                    usedThisMonth ? 'text-gray-500' : ''
                                  }`}>
                                    {alt.name}
                                  </p>
                                  {usedThisMonth && (
                                    <Badge variant="warning" className="text-xs">
                                      Used This Month
                                    </Badge>
                                  )}
                                  {!usedThisMonth && (
                                    <Badge variant="info" className="text-xs">
                                      Available
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 ${
                                  usedThisMonth ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Price: {formatCurrency(alt.price)} per unit
                                </p>
                              </div>
                              <div className="text-right">
                                {alt.difference < 0 ? (
                                  <p className={`text-xs font-medium ${
                                    usedThisMonth ? 'text-gray-400' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(Math.abs(alt.difference))} less
                                  </p>
                                ) : (
                                  <p className={`text-xs font-medium ${
                                    usedThisMonth ? 'text-gray-400' : 'text-green-600'
                                  }`}>
                                    {formatCurrency(alt.difference)} more
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        <strong>Tip:</strong> Use available distributors (marked with "Available" badge) to maximize your monthly earnings!
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                    onClick={() => setSelectedAnalysis(rec)}
                  >
                    View Full Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">How Optimization Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Product Analysis</p>
                  <p className="text-blue-700">We analyze pricing data from all reverse distributors for each NDC code</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Price Comparison</p>
                  <p className="text-blue-700">Compare prices across distributors to find the best rates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Recommendations</p>
                  <p className="text-blue-700">Get specific recommendations on which distributor to use for each product</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Analysis Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Full Analysis</h3>
                    <p className="text-xs text-gray-600">{selectedAnalysis.productName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Product Information */}
                  <Card className="border-2 border-teal-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-5 w-5 text-teal-600" />
                        Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Product Name</p>
                          <p className="text-sm font-semibold">{selectedAnalysis.productName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">NDC Code</p>
                          <p className="text-sm font-mono font-semibold">{selectedAnalysis.ndc}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Potential Savings</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(selectedAnalysis.savings)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommended Distributor Details */}
                  <Card className="border-2 border-emerald-200 bg-emerald-50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Recommended Distributor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const distributor = mockDistributors.find(d => d.name === selectedAnalysis.recommendedDistributor);
                        const usedThisMonth = distributor && usedDistributorsThisMonth.has(distributor.id);
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
                                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-emerald-900">
                                    {selectedAnalysis.recommendedDistributor}
                                  </h4>
                                  {usedThisMonth ? (
                                    <Badge variant="warning" className="text-xs mt-1">
                                      Used This Month
                                    </Badge>
                                  ) : (
                                    <Badge variant="success" className="text-xs mt-1">
                                      Available This Month
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Expected Price</p>
                                <p className="text-2xl font-bold text-emerald-700">
                                  {formatCurrency(selectedAnalysis.expectedPrice)}
                                </p>
                                <p className="text-xs text-gray-500">per unit</p>
                              </div>
                            </div>
                            
                            {distributor && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-emerald-200">
                                {distributor.contactEmail && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-600">Email</p>
                                      <p className="text-sm font-medium">{distributor.contactEmail}</p>
                                    </div>
                                  </div>
                                )}
                                {distributor.contactPhone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-600">Phone</p>
                                      <p className="text-sm font-medium">{distributor.contactPhone}</p>
                                    </div>
                                  </div>
                                )}
                                {distributor.address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-xs text-gray-600">Location</p>
                                      <p className="text-sm font-medium">
                                        {distributor.address.city}, {distributor.address.state}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <p className="text-xs text-gray-600">Supported Formats</p>
                                    <div className="flex gap-1 mt-1">
                                      {distributor.supportedFormats.map((format, idx) => (
                                        <Badge key={idx} variant="info" className="text-xs">
                                          {format}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-4 border-t border-emerald-200">
                              <div className="p-3 bg-white rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-600">Estimated Total Savings</p>
                                    <p className="text-xl font-bold text-emerald-700">
                                      {formatCurrency(selectedAnalysis.savings)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-600">Price Advantage</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                      {selectedAnalysis.alternativeDistributors.length > 0 
                                        ? `${((selectedAnalysis.expectedPrice - Math.min(...selectedAnalysis.alternativeDistributors.map(a => a.price))) / Math.min(...selectedAnalysis.alternativeDistributors.map(a => a.price)) * 100).toFixed(1)}%`
                                        : 'Best Price'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* All Distributors Comparison */}
                  <Card className="border-2 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        Complete Distributor Comparison
                      </CardTitle>
                      <CardDescription>
                        Compare all available distributors for this product
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Recommended Distributor */}
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                1
                              </div>
                              <div>
                                <p className="font-bold text-emerald-900">
                                  {selectedAnalysis.recommendedDistributor}
                                </p>
                                <p className="text-xs text-emerald-700">Recommended - Best Price</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-700">
                                {formatCurrency(selectedAnalysis.expectedPrice)}
                              </p>
                              <p className="text-xs text-emerald-600">per unit</p>
                            </div>
                          </div>
                        </div>

                        {/* Alternative Distributors */}
                        {selectedAnalysis.alternativeDistributors.map((alt, idx) => {
                          const distributor = mockDistributors.find(d => d.name === alt.name);
                          const usedThisMonth = distributor && usedDistributorsThisMonth.has(distributor.id);
                          const priceDiff = selectedAnalysis.expectedPrice - alt.price;
                          const isBetter = priceDiff < 0;
                          
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border-2 ${
                                usedThisMonth
                                  ? 'bg-gray-100 border-gray-300 opacity-75'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    usedThisMonth
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {idx + 2}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className={`font-bold ${
                                        usedThisMonth ? 'text-gray-500' : 'text-gray-900'
                                      }`}>
                                        {alt.name}
                                      </p>
                                      {usedThisMonth && (
                                        <Badge variant="warning" className="text-xs">
                                          Used This Month
                                        </Badge>
                                      )}
                                      {!usedThisMonth && (
                                        <Badge variant="info" className="text-xs">
                                          Available
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <p className={`text-xs ${
                                        usedThisMonth ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        Price: {formatCurrency(alt.price)} per unit
                                      </p>
                                      {!usedThisMonth && (
                                        <p className={`text-xs font-medium ${
                                          isBetter ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {isBetter 
                                            ? `${formatCurrency(Math.abs(priceDiff))} better than recommended`
                                            : `${formatCurrency(priceDiff)} more than recommended`
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${
                                    usedThisMonth ? 'text-gray-400' : 'text-gray-700'
                                  }`}>
                                    {formatCurrency(alt.price)}
                                  </p>
                                  <p className={`text-xs ${
                                    usedThisMonth ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    per unit
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis Summary */}
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Analysis Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900">
                              Best Option: {selectedAnalysis.recommendedDistributor}
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                              This distributor offers the best price per unit at {formatCurrency(selectedAnalysis.expectedPrice)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900">
                              Potential Savings: {formatCurrency(selectedAnalysis.savings)}
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                              Compared to alternative distributors, you can save this amount by choosing the recommended option
                            </p>
                          </div>
                        </div>
                        {(() => {
                          const distributor = mockDistributors.find(d => d.name === selectedAnalysis.recommendedDistributor);
                          const usedThisMonth = distributor && usedDistributorsThisMonth.has(distributor.id);
                          if (usedThisMonth) {
                            return (
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-yellow-900">
                                    Monthly Usage Alert
                                  </p>
                                  <p className="text-yellow-700 text-xs mt-1">
                                    This distributor has already been used this month. Consider using an available alternative distributor to maximize your monthly earnings.
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAnalysis(null)}
                >
                  Close
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    // In production, this would trigger an action
                    alert('Action: Proceed with recommended distributor');
                    setSelectedAnalysis(null);
                  }}
                >
                  Proceed with Recommendation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

