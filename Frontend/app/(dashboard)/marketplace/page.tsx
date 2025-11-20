"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Filter, ShoppingCart, Star, Plus, Heart, Eye, TrendingDown, MapPin, Calendar, Package, Grid3x3, List } from 'lucide-react';
import { mockListings } from '@/data/mockMarketplace';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Link from 'next/link';

type SortOption = 'price-asc' | 'price-desc' | 'quantity-asc' | 'quantity-desc' | 'newest' | 'rating';
type FilterOption = 'all' | 'active' | 'expiring-soon';
type ViewMode = 'grid' | 'table';

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const toggleFavorite = (listingId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  let filteredListings = mockListings.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        listing.drugName.toLowerCase().includes(query) ||
        listing.ndc.includes(query) ||
        listing.manufacturer.toLowerCase().includes(query) ||
        listing.lotNumber.toLowerCase().includes(query);
      if (!matches) return false;
    }
    if (filterStatus === 'active' && listing.status !== 'active') return false;
    if (filterStatus === 'expiring-soon') {
      const expDate = new Date(listing.expirationDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      if (expDate > sixMonthsFromNow) return false;
    }
    return true;
  });

  filteredListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.pricePerUnit - b.pricePerUnit;
      case 'price-desc': return b.pricePerUnit - a.pricePerUnit;
      case 'quantity-asc': return a.quantity - b.quantity;
      case 'quantity-desc': return b.quantity - a.quantity;
      case 'rating': return b.sellerRating - a.sellerRating;
      case 'newest':
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleAddToCart = (listingId: string) => {
    setCartCount(prev => prev + 1);
  };

  const getDiscount = (price: number, wac: number) => {
    return Math.round((1 - price / wac) * 100);
  };

  const isExpiringSoon = (expDate: string) => {
    const exp = new Date(expDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return exp <= sixMonthsFromNow;
  };

  return (
    <DashboardLayout>
      <div className="space-y-2">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Marketplace</h1>
            <p className="text-xs text-muted-foreground">Buy and sell pharmaceutical inventory</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace/create">
              <Button size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Create Listing
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => alert('Cart functionality')}>
              <ShoppingCart className="mr-1 h-3 w-3" />
              Cart ({cartCount})
            </Button>
          </div>
        </div>

        {/* Compact Filters */}
        <Card>
          <CardContent className="p-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-7 h-7 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="h-7 px-2 text-xs border rounded">
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="quantity-desc">Quantity: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterOption)} className="h-7 px-2 text-xs border rounded">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
              </select>
              <div className="flex gap-1 border rounded">
                <Button variant={viewMode === 'table' ? 'primary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('table')}>
                  <List className="h-3 w-3" />
                </Button>
                <Button variant={viewMode === 'grid' ? 'primary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('grid')}>
                  <Grid3x3 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-2">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-2 font-medium">Product</th>
                      <th className="text-left p-2 font-medium">NDC</th>
                      <th className="text-left p-2 font-medium">Manufacturer</th>
                      <th className="text-left p-2 font-medium">Qty</th>
                      <th className="text-left p-2 font-medium">Expiration</th>
                      <th className="text-left p-2 font-medium">WAC</th>
                      <th className="text-left p-2 font-medium">Price/Unit</th>
                      <th className="text-left p-2 font-medium">Total</th>
                      <th className="text-left p-2 font-medium">Discount</th>
                      <th className="text-left p-2 font-medium">Seller</th>
                      <th className="text-left p-2 font-medium">Rating</th>
                      <th className="text-left p-2 font-medium">Location</th>
                      <th className="text-left p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.length === 0 ? (
                      <tr><td colSpan={13} className="p-4 text-center text-muted-foreground text-sm">No listings found</td></tr>
                    ) : (
                      filteredListings.map((listing) => {
                        const discount = getDiscount(listing.pricePerUnit, listing.wacPrice);
                        const expiringSoon = isExpiringSoon(listing.expirationDate);
                        const isFavorite = favorites.has(listing.id);
                        return (
                          <tr key={listing.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{listing.drugName}</div>
                              <div className="text-muted-foreground">{listing.strength}</div>
                            </td>
                            <td className="p-2 font-mono">{listing.ndc}</td>
                            <td className="p-2">{listing.manufacturer}</td>
                            <td className="p-2">{listing.quantity.toLocaleString()} {listing.unit}</td>
                            <td className={`p-2 ${expiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                              {formatDate(listing.expirationDate)}
                            </td>
                            <td className="p-2 line-through text-muted-foreground">{formatCurrency(listing.wacPrice)}</td>
                            <td className="p-2 font-medium text-primary">{formatCurrency(listing.pricePerUnit)}</td>
                            <td className="p-2 font-bold">{formatCurrency(listing.pricePerUnit * listing.quantity)}</td>
                            <td className="p-2">
                              {discount > 0 ? (
                                <Badge variant="success" className="text-xs">{discount}% OFF</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2">{listing.sellerName}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{listing.sellerRating}</span>
                              </div>
                            </td>
                            <td className="p-2">{listing.location.city}, {listing.location.state}</td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => toggleFavorite(listing.id)}>
                                  <Heart className={`h-3 w-3 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => handleAddToCart(listing.id)}>
                                  <ShoppingCart className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredListings.map((listing) => {
              const discount = getDiscount(listing.pricePerUnit, listing.wacPrice);
              const expiringSoon = isExpiringSoon(listing.expirationDate);
              const isFavorite = favorites.has(listing.id);
              return (
                <Card key={listing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{listing.drugName}</h3>
                        <p className="text-xs text-muted-foreground">{listing.strength}</p>
                      </div>
                      <button onClick={() => toggleFavorite(listing.id)} className="p-1">
                        <Heart className={`h-3 w-3 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="space-y-1 text-xs mb-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Qty:</span>
                        <span className="font-medium">{listing.quantity} {listing.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exp:</span>
                        <span className={expiringSoon ? 'text-orange-600 font-medium' : ''}>{formatDate(listing.expirationDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-primary">{formatCurrency(listing.pricePerUnit)}/unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">{formatCurrency(listing.pricePerUnit * listing.quantity)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => handleAddToCart(listing.id)}>
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 px-2" onClick={() => alert(`View ${listing.id}`)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
