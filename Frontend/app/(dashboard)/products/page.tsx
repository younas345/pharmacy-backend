"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  ScanLine, 
  Plus, 
  Upload, 
  X, 
  Search,
  Package,
  FileSpreadsheet,
  Camera,
  Keyboard,
  TrendingUp,
  Download,
  Check,
  Database,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import type { ProductListItem, ProductList } from '@/types';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { productsService, productListsService } from '@/lib/api/services';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'bulk' | 'lists'>('scan');
  const [ndcInput, setNdcInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Product form fields
  const [quantity, setQuantity] = useState<number>(1);
  const [lotNumber, setLotNumber] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Modals state
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedProductsForList, setSelectedProductsForList] = useState<Set<string>>(new Set());

  // Load products from database on mount
  useEffect(() => {
    loadProducts();
    loadProductLists();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products from product_list_items table...');
      
      // Use simplified API - gets items directly from product_list_items
      const items = await productListsService.getItems();
      console.log(`✅ Loaded ${items.length} products from product_list_items`);
      
      // Transform API items to frontend format
      const transformed = items.map((item: any) => ({
        id: item.id,
        ndc: item.ndc,
        productName: item.product_name,
        quantity: item.quantity,
        lotNumber: item.lot_number,
        expirationDate: item.expiration_date,
        notes: item.notes,
        addedAt: item.added_at,
        addedBy: item.added_by,
      }));
      
      setProducts(transformed);
    } catch (err: any) {
      console.error('❌ Failed to load products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadProductLists = async () => {
    try {
      const lists = await productListsService.getAllLists();
      // Transform to match frontend type
      const transformed = lists.map((list: any) => ({
        id: list.id,
        pharmacyId: list.pharmacy_id,
        name: list.name,
        products: (list.items || []).map((item: any) => ({
          id: item.id,
          ndc: item.ndc,
          productName: item.product_name,
          quantity: item.quantity,
          lotNumber: item.lot_number,
          expirationDate: item.expiration_date,
          notes: item.notes,
          addedAt: item.added_at,
          addedBy: item.added_by,
        })),
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      }));
      setProductLists(transformed);
    } catch (err: any) {
      console.error('Failed to load product lists:', err);
    }
  };

  const handleScan = () => {
    setShowScanner(true);
  };

  const handleBarcodeScan = async (code: string) => {
    console.log('🔍 handleBarcodeScan called with code:', code);
    setShowScanner(false);
    setError(null);
    setLoading(true);
    
    if (!code || !code.trim()) {
      console.warn('⚠️ Empty barcode code received');
      setLoading(false);
      return;
    }

    try {
      // Call backend API to parse barcode using Azure OpenAI
      // Use the API base URL from environment or default
      // Note: Backend runs on port 3000, frontend might be on 3001
      // If NEXT_PUBLIC_API_URL is set, use it, otherwise try backend directly
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // If API URL is not set or points to frontend, use backend directly
      if (!apiBaseUrl || apiBaseUrl.includes('localhost:3001') || apiBaseUrl.includes('localhost:3000/api')) {
        // Backend typically runs on port 3000
        apiBaseUrl = 'http://localhost:3000/api';
      }
      
      const apiUrl = `${apiBaseUrl}/barcode/parse`;
      
      console.log('📡 Calling backend API:', apiUrl);
      console.log('📦 Request body:', { barcodeData: code });
      console.log('🌐 API Base URL from env:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcodeData: code }),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse barcode' }));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to parse barcode');
      }

      const result = await response.json();
      console.log('✅ API Response:', result);
      
      const parsed = result.data;
      
      if (!parsed) {
        throw new Error('No data returned from API');
      }
      
      // Set the parsed values from AI
      setNdcInput(parsed.ndc || code.trim());
      if (parsed.lotNumber) {
        setLotNumber(parsed.lotNumber);
      } else {
        setLotNumber('');
      }
      if (parsed.expirationDate) {
        setExpirationDate(parsed.expirationDate);
      } else {
        setExpirationDate('');
      }
      
      console.log('✅ Parsed data set:', { ndc: parsed.ndc, lotNumber: parsed.lotNumber, expirationDate: parsed.expirationDate });
    } catch (err: any) {
      console.error('❌ Error parsing barcode with AI:', err);
      // Fallback: use the scanned code as NDC
      setNdcInput(code.trim());
      setLotNumber('');
      setExpirationDate('');
      setError(`Could not parse barcode data: ${err.message || 'Unknown error'}. Using scanned code as NDC only.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!ndcInput.trim()) {
      setError('Please enter an NDC code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await productsService.validateNDC(ndcInput);
      
      if (!result.valid || !result.product) {
        setError(result.error || result.suggestion || 'Product not found for this NDC');
        setLoading(false);
        return;
      }

      console.log('➕ Adding product to product_list_items:', {
        ndc: result.product.ndc,
        productName: (result.product as any).product_name,
        quantity,
        lotNumber,
        expirationDate,
        notes,
      });

      // Save directly to product_list_items table (simplified API - no list_id needed)
      const addedItem = await productListsService.addItem('', {
        ndc: result.product.ndc,
        product_name: (result.product as any).product_name || result.product.productName || 'Unknown Product',
        quantity: quantity || 1,
        lot_number: lotNumber || undefined,
        expiration_date: expirationDate || undefined,
        notes: notes || undefined,
      });

      console.log('✅ Product added to list successfully:', addedItem);

      // Reload products from database
      await loadProducts();
      
      // Reset form fields after successful add
      setNdcInput('');
      setQuantity(1);
      setLotNumber('');
      setExpirationDate('');
      setNotes('');
      
      setSuccess(`Product added: ${(result.product as any).product_name || result.product.productName}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setError(null);
    setLoading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('File must contain at least a header row and one data row');
        setLoading(false);
        return;
      }
      
      // Parse CSV - Expected format: NDC,Product Name,Quantity,Lot Number,Expiration Date,Notes
      const csvRows = lines.slice(1).map(line => {
        const columns = line.split(',').map(col => col.trim());
        return {
          ndc: columns[0] || '',
          productName: columns[1] || '',
          quantity: parseInt(columns[2]) || 1,
          lotNumber: columns[3] || undefined,
          expirationDate: columns[4] || undefined,
          notes: columns[5] || undefined,
        };
      }).filter(row => row.ndc);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const row of csvRows) {
        try {
          const result = await productsService.validateNDC(row.ndc);
          if (result.valid && result.product) {
            // Save directly to product_list_items table (simplified API)
            await productListsService.addItem('', {
              ndc: result.product.ndc,
              product_name: row.productName || (result.product as any).product_name || result.product.productName || 'Unknown Product',
              quantity: row.quantity || 1,
              lot_number: row.lotNumber || undefined,
              expiration_date: row.expirationDate || undefined,
              notes: row.notes || undefined,
            });
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error('Error adding product:', err);
          failCount++;
        }
      }
      
      // Reload products from database
      await loadProducts();
      
      setSuccess(`Bulk upload completed: ${successCount} products added, ${failCount} failed`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await productListsService.removeItem(id);
      await loadProducts();
      setSuccess('Product removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.ndc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create New List functionality
  const handleCreateList = () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    const selectedProductsList = products.filter(p => selectedProductsForList.has(p.id));
    
    const newList: ProductList = {
      id: `list-${Date.now()}`,
      pharmacyId: 'pharm-1',
      name: newListName,
      products: selectedProductsList.length > 0 ? selectedProductsList : products,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProductLists([...productLists, newList]);
    setShowCreateListModal(false);
    setNewListName('');
    setSelectedProductsForList(new Set());
    alert(`List "${newListName}" created successfully with ${newList.products.length} products!`);
  };

  // Export Products functionality
  const handleExportProducts = () => {
    if (products.length === 0) {
      alert('No products to export');
      return;
    }

    // Create CSV content
    const headers = ['NDC', 'Product Name', 'Quantity', 'Lot Number', 'Expiration Date', 'Notes', 'Added At'];
    const rows = products.map(p => [
      p.ndc,
      p.productName,
      p.quantity.toString(),
      p.lotNumber || '',
      p.expirationDate || '',
      p.notes || '',
      new Date(p.addedAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Exported ${products.length} products successfully!`);
  };


  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Products</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage products for return optimization</p>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {(success || error) && (
          <div className={`p-2 rounded text-sm flex items-center gap-2 ${success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {success ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{success || error}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-5 w-5 p-0" onClick={() => { setSuccess(null); setError(null); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 bg-white rounded-t-lg p-1">
          {[
            { id: 'scan', label: 'Scan Barcode', icon: Camera },
            { id: 'manual', label: 'Manual Entry', icon: Keyboard },
            { id: 'bulk', label: 'Bulk Upload', icon: FileSpreadsheet },
            { id: 'lists', label: 'Product Lists', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {/* Barcode Scanner */}
            {activeTab === 'scan' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Scan NDC Barcode</CardTitle>
                  <CardDescription>Use your device camera to scan product barcodes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-4">Click "Start Scanning" to open camera</p>
                      <Button onClick={handleScan} className="bg-teal-600 hover:bg-teal-700">
                        <ScanLine className="mr-2 h-4 w-4" />
                        Start Scanning
                      </Button>
                    </div>
                  </div>

                  {ndcInput && (
                    <Card className="border-2 border-teal-300 bg-teal-50/50">
                      <CardHeader>
                        <CardTitle className="text-base">Scanned Barcode Data</CardTitle>
                        <CardDescription>Review and complete the product information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Scanned Data (Read-only) */}
                        <div className="p-3 bg-white border border-teal-200 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-2">Scanned from Barcode:</p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-500">NDC Code *</label>
                              <p className="text-sm font-mono font-bold text-teal-700">{ndcInput}</p>
                            </div>
                            {lotNumber && (
                              <div>
                                <label className="text-xs text-gray-500">Lot Number</label>
                                <p className="text-sm font-mono text-teal-700">{lotNumber}</p>
                              </div>
                            )}
                            {expirationDate && (
                              <div>
                                <label className="text-xs text-gray-500">Expiration Date</label>
                                <p className="text-sm font-mono text-teal-700">{expirationDate}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Manual Entry Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Product Name *</label>
                            <Input
                              placeholder="Will be fetched from NDC database"
                              disabled
                              className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Product name will be retrieved when you add the product</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Quantity *</label>
                              <Input 
                                type="number" 
                                min="1" 
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Lot Number</label>
                              <Input 
                                placeholder="Enter lot number"
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Expiration Date</label>
                            <Input 
                              type="date"
                              value={expirationDate}
                              onChange={(e) => setExpirationDate(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                            <textarea
                              className="w-full px-3 py-2 border border-input rounded-lg text-sm min-h-[80px]"
                              placeholder="Additional notes..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddProduct}
                              className="flex-1 bg-teal-600 hover:bg-teal-700"
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                              Add Product
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setNdcInput('');
                                setLotNumber('');
                                setExpirationDate('');
                                setQuantity(1);
                                setNotes('');
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Manual Entry */}
            {activeTab === 'manual' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Manual NDC Entry</CardTitle>
                  <CardDescription>Enter NDC codes manually or paste from clipboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">NDC Code *</label>
                    <Input
                      value={ndcInput}
                      onChange={(e) => setNdcInput(e.target.value)}
                      placeholder="00093-2263-01 or 00093226301"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: XXXXX-XXXX-XX (dashes optional)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantity *</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Lot Number (Optional)</label>
                      <Input 
                        placeholder="LOT-2024-001"
                        value={lotNumber}
                        onChange={(e) => setLotNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Expiration Date (Optional)</label>
                    <Input 
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm min-h-[80px]"
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleAddProduct}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Product
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bulk Upload */}
            {activeTab === 'bulk' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Bulk Upload</CardTitle>
                  <CardDescription>Upload CSV or Excel file with product data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-teal-500" />
                    <p className="text-sm font-medium mb-2">Upload CSV or Excel file</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Supported formats: .csv, .xlsx, .xls
                    </p>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkUpload}
                      className="hidden"
                      id="bulk-upload"
                    />
                    <label htmlFor="bulk-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button">
                        Choose File
                      </Button>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Expected CSV Format:</p>
                    <div className="text-xs font-mono bg-white p-2 rounded border">
                      NDC,Product Name,Quantity,Lot Number,Expiration Date,Notes
                      <br />
                      00093-2263-01,Amoxicillin 500mg,100,LOT-001,2025-06-30,Refrigerate
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Note: Only NDC is required. Other fields are optional.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Lists */}
            {activeTab === 'lists' && (
              <div className="space-y-3">
                {productLists.map((list) => (
                  <Card key={list.id} className="border-2 border-teal-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{list.name}</CardTitle>
                          <CardDescription>
                            {list.products.length} products • Updated {formatDate(list.updatedAt)}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {list.products.slice(0, 3).map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="text-sm font-medium">{product.productName}</p>
                              <p className="text-xs text-gray-600">NDC: {product.ndc} • Qty: {product.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {list.products.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{list.products.length - 3} more products
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Product List (for scan/manual/bulk tabs) */}
            {activeTab !== 'lists' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Current Products ({products.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                      {products.length > 0 && (
                        <Link href="/optimization">
                          <Button 
                            size="sm" 
                            className="bg-teal-600 hover:bg-teal-700 text-white border-0"
                          >
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Optimize
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No products yet. Add products using the tabs above.
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{product.productName}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>NDC: <span className="font-mono">{product.ndc}</span></span>
                              <span>Qty: {product.quantity}</span>
                              {product.lotNumber && <span>Lot: {product.lotNumber}</span>}
                              {product.expirationDate && (
                                <span>Exp: {formatDate(product.expirationDate)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card className="border-2 border-cyan-200">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setActiveTab('scan')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Create New List
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleExportProducts}
                  disabled={products.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Products
                </Button>
                <Link href="/reports">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Search NDC Database
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product Lists:</span>
                    <span className="font-bold">{productLists.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create New List Modal */}
        {showCreateListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-600" />
                  <h3 className="font-bold text-lg">Create New Product List</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                    setSelectedProductsForList(new Set());
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">List Name *</label>
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., January Returns, Expiring Products, etc."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Products ({selectedProductsForList.size} selected)
                  </label>
                  <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No products available. Add products first.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <button
                            onClick={() => {
                              if (selectedProductsForList.size === products.length) {
                                setSelectedProductsForList(new Set());
                              } else {
                                setSelectedProductsForList(new Set(products.map(p => p.id)));
                              }
                            }}
                            className="text-xs text-teal-600 hover:text-teal-700"
                          >
                            {selectedProductsForList.size === products.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {products.map((product) => (
                          <label
                            key={product.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProductsForList.has(product.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedProductsForList);
                                if (e.target.checked) {
                                  newSet.add(product.id);
                                } else {
                                  newSet.delete(product.id);
                                }
                                setSelectedProductsForList(newSet);
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{product.productName}</p>
                              <p className="text-xs text-gray-600">NDC: {product.ndc} • Qty: {product.quantity}</p>
                            </div>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedProductsForList.size === 0 
                      ? 'No products selected. All current products will be added to the list.'
                      : `${selectedProductsForList.size} product(s) selected.`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateList}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    disabled={!newListName.trim()}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Create List
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateListModal(false);
                      setNewListName('');
                      setSelectedProductsForList(new Set());
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={showScanner}
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      </div>
    </DashboardLayout>
  );
}

