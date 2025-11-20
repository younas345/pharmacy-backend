"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Building2, 
  Search,
  X,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { mockDistributors } from '@/data/mockDistributors';
import { mockProductItems } from '@/data/mockProducts';
import { mockPricingData, mockPriceComparisons } from '@/data/mockPricing';
import type { ReverseDistributor, ProductListItem, PricingData, PriceComparison } from '@/types';
import { formatDate } from '@/lib/utils/format';

interface DistributorRanking {
  distributor: ReverseDistributor;
  averagePricePerUnit: number;
  totalDataPoints: number;
  rank: number;
  priceComparison?: PriceComparison;
}

export default function TopDistributorsPage() {
  const [distributors, setDistributors] = useState<ReverseDistributor[]>(mockDistributors);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<ProductListItem | null>(null);
  const [distributorRankings, setDistributorRankings] = useState<DistributorRanking[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Filter distributors based on search
  const filteredDistributors = distributors.filter(dist =>
    dist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dist.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get inventory items (from products)
  const inventoryItems = mockProductItems;

  // Handle Compare button click
  const handleCompare = () => {
    setShowInventoryModal(true);
  };

  // Handle inventory selection
  const handleSelectInventory = (inventory: ProductListItem) => {
    setSelectedInventory(inventory);
    setShowInventoryModal(false);
    setIsComparing(true);
    calculateTopDistributors(inventory);
  };

  // Calculate top distributors based on selected inventory
  const calculateTopDistributors = (inventory: ProductListItem) => {
    // Find pricing data for the selected inventory NDC
    const pricingForNDC = mockPricingData.filter(
      p => p.ndc === inventory.ndc
    );

    // Find price comparison if available
    const priceComparison = mockPriceComparisons.find(
      pc => pc.ndc === inventory.ndc
    );

    // Group pricing by distributor
    const distributorMap = new Map<string, {
      distributor: ReverseDistributor;
      prices: number[];
      totalDataPoints: number;
    }>();

    pricingForNDC.forEach(pricing => {
      const distributor = mockDistributors.find(d => d.id === pricing.reverseDistributorId);
      if (distributor) {
        if (!distributorMap.has(distributor.id)) {
          distributorMap.set(distributor.id, {
            distributor,
            prices: [],
            totalDataPoints: 0,
          });
        }
        const entry = distributorMap.get(distributor.id)!;
        entry.prices.push(pricing.pricePerUnit);
        entry.totalDataPoints++;
      }
    });

    // If we have a price comparison, use that data
    if (priceComparison) {
      priceComparison.distributorPrices.forEach(dp => {
        const distributor = mockDistributors.find(d => d.id === dp.distributorId);
        if (distributor) {
          if (!distributorMap.has(distributor.id)) {
            distributorMap.set(distributor.id, {
              distributor,
              prices: [],
              totalDataPoints: 0,
            });
          }
          const entry = distributorMap.get(distributor.id)!;
          // Use average price from comparison
          entry.prices.push(dp.averagePricePerUnit);
          entry.totalDataPoints = dp.dataPoints;
        }
      });
    }

    // Calculate rankings
    const rankings: DistributorRanking[] = Array.from(distributorMap.values())
      .map(entry => ({
        distributor: entry.distributor,
        averagePricePerUnit: entry.prices.reduce((sum, p) => sum + p, 0) / entry.prices.length,
        totalDataPoints: entry.totalDataPoints,
        rank: 0,
        priceComparison: priceComparison || undefined,
      }))
      .sort((a, b) => b.averagePricePerUnit - a.averagePricePerUnit) // Sort by highest price (best return)
      .map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
      }));

    setDistributorRankings(rankings);
  };

  // Reset comparison
  const handleResetComparison = () => {
    setSelectedInventory(null);
    setIsComparing(false);
    setDistributorRankings([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Top Distributors</h1>
            <p className="text-xs text-gray-600 mt-0.5">Compare distributors and find the best returns</p>
          </div>
          {!isComparing && (
            <Button 
              onClick={handleCompare}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Compare
            </Button>
          )}
          {isComparing && (
            <Button 
              onClick={handleResetComparison}
              variant="outline"
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {!isComparing ? (
          /* Distributors List View */
          <div className="space-y-3">
            {/* Search */}
            <Card className="border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search distributors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Distributors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDistributors.map((distributor) => (
                <Card key={distributor.id} className="border-2 border-teal-200 hover:border-teal-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Building2 className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{distributor.name}</CardTitle>
                          <CardDescription className="text-xs">Code: {distributor.code}</CardDescription>
                        </div>
                      </div>
                      {distributor.isActive && (
                        <Badge variant="success" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {distributor.contactEmail && (
                      <div className="text-sm">
                        <span className="text-gray-600">Email: </span>
                        <span className="font-medium">{distributor.contactEmail}</span>
                      </div>
                    )}
                    {distributor.contactPhone && (
                      <div className="text-sm">
                        <span className="text-gray-600">Phone: </span>
                        <span className="font-medium">{distributor.contactPhone}</span>
                      </div>
                    )}
                    {distributor.address && (
                      <div className="text-sm">
                        <span className="text-gray-600">Location: </span>
                        <span className="font-medium">
                          {distributor.address.city}, {distributor.address.state}
                        </span>
                      </div>
                    )}
                    {/* <div className="flex flex-wrap gap-1 pt-2">
                      {distributor.supportedFormats.map((format, idx) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div> */}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDistributors.length === 0 && (
              <Card className="border-2 border-gray-200">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No distributors found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Comparison View */
          <div className="space-y-3">
            {/* Selected Inventory Info */}
            {selectedInventory && (
              <Card className="border-2 border-teal-200 bg-teal-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-teal-600" />
                    Selected Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Product Name</p>
                      <p className="text-sm font-medium">{selectedInventory.productName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">NDC</p>
                      <p className="text-sm font-mono font-medium">{selectedInventory.ndc}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Quantity</p>
                      <p className="text-sm font-medium">{selectedInventory.quantity}</p>
                    </div>
                    {selectedInventory.expirationDate && (
                      <div>
                        <p className="text-xs text-gray-600">Expiration</p>
                        <p className="text-sm font-medium">{formatDate(selectedInventory.expirationDate)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Distributors Rankings */}
            {distributorRankings.length > 0 ? (
              <div className="space-y-3">
                <Card className="border-2 border-teal-200">
                  <CardHeader>
                    <CardTitle className="text-base">Top Distributors Ranking</CardTitle>
                    <CardDescription>
                      Ranked by average price per unit (highest return first)
                    </CardDescription>
                  </CardHeader>
                </Card>

                {distributorRankings.map((ranking, index) => {
                  const previousRanking = index > 0 ? distributorRankings[index - 1] : null;
                  const priceDiff = previousRanking 
                    ? ranking.averagePricePerUnit - previousRanking.averagePricePerUnit
                    : 0;
                  const isBest = ranking.rank === 1;

                  return (
                    <Card 
                      key={ranking.distributor.id} 
                      className={`border-2 ${
                        isBest 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-teal-200'
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Rank Badge */}
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                              isBest 
                                ? 'bg-yellow-400 text-yellow-900' 
                                : ranking.rank === 2
                                ? 'bg-gray-300 text-gray-700'
                                : ranking.rank === 3
                                ? 'bg-orange-300 text-orange-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {ranking.rank}
                            </div>

                            {/* Distributor Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-5 w-5 text-teal-600" />
                                <h3 className="text-lg font-bold">{ranking.distributor.name}</h3>
                                {isBest && (
                                  <Badge variant="success" className="text-xs">
                                    Best Return
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-600">Average Price/Unit</p>
                                  <p className="text-lg font-bold text-teal-600">
                                    ${ranking.averagePricePerUnit.toFixed(4)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Data Points</p>
                                  <p className="text-sm font-medium">{ranking.totalDataPoints}</p>
                                </div>
                                {previousRanking && (
                                  <div>
                                    <p className="text-xs text-gray-600">vs Previous</p>
                                    <div className="flex items-center gap-1">
                                      {priceDiff > 0 ? (
                                        <>
                                          <ArrowUp className="h-4 w-4 text-red-600" />
                                          <span className="text-sm font-medium text-red-600">
                                            ${Math.abs(priceDiff).toFixed(4)}
                                          </span>
                                        </>
                                      ) : priceDiff < 0 ? (
                                        <>
                                          <ArrowDown className="h-4 w-4 text-green-600" />
                                          <span className="text-sm font-medium text-green-600">
                                            ${Math.abs(priceDiff).toFixed(4)}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Minus className="h-4 w-4 text-gray-600" />
                                          <span className="text-sm font-medium text-gray-600">Same</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {ranking.distributor.contactEmail && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {ranking.distributor.contactEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No pricing data available for this inventory item.</p>
                  <p className="text-sm text-gray-500">
                    Try selecting a different inventory item or upload more documents to get pricing data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Inventory Selection Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-600" />
                  <h3 className="font-bold text-lg">Select Inventory to Compare</h3>
                </div>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {inventoryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">No inventory items available.</p>
                    <p className="text-sm text-gray-500">
                      Please add products to your inventory first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inventoryItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectInventory(item)}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-base">{item.productName}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>NDC: <span className="font-mono">{item.ndc}</span></span>
                              <span>Qty: {item.quantity}</span>
                              {item.lotNumber && <span>Lot: {item.lotNumber}</span>}
                              {item.expirationDate && (
                                <span>Exp: {formatDate(item.expirationDate)}</span>
                              )}
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-teal-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

