"use client";

import { useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Mail,
  Globe,
  CloudUpload,
} from 'lucide-react';
import { mockDistributors } from '@/data/mockDistributors';
import { formatDate } from '@/lib/utils/format';
import type { UploadedDocument, DocumentSource } from '@/types';
import Link from 'next/link';
import { documentsService } from '@/lib/api/services';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [uploadSource, setUploadSource] = useState<DocumentSource>('manual_upload');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
      );
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload files one by one
      for (const file of files) {
        await documentsService.uploadDocument(file, selectedDistributor || undefined);
      }
      
      setSuccess(`Successfully uploaded ${files.length} file(s)! Processing will begin shortly.`);
      setFiles([]);
      setSelectedDistributor('');
      
      // Redirect to documents page after 2 seconds
      setTimeout(() => {
        router.push('/documents');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };


  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Upload Documents</h1>
            <p className="text-xs text-gray-600 mt-0.5">Upload credit reports from reverse distributors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-3">
            {/* Upload Source Selection */}
            <Card className="border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="text-base">Upload Method</CardTitle>
                <CardDescription>Choose how you want to upload documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setUploadSource('manual_upload')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      uploadSource === 'manual_upload'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CloudUpload className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Manual Upload</p>
                  </button>
                  <button
                    onClick={() => setUploadSource('email_forward')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      uploadSource === 'email_forward'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Email Forward</p>
                  </button>
                  {/* <button
                    onClick={() => setUploadSource('portal_fetch')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      uploadSource === 'portal_fetch'
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Portal Fetch</p>
                  </button> */}
                </div>
              </CardContent>
            </Card>

            {/* Manual Upload */}
            {uploadSource === 'manual_upload' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Select Files</CardTitle>
                  <CardDescription>Upload PDF credit reports (multiple files supported)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Distributor Selection */}
                  {/* <div>
                    <label className="text-sm font-medium mb-2 block">Reverse Distributor *</label>
                    <select
                      value={selectedDistributor}
                      onChange={(e) => setSelectedDistributor(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a distributor...</option>
                      {mockDistributors.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  {/* Drag and Drop Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50/50'
                    }`}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-teal-500" />
                    <p className="text-sm font-medium mb-2">
                      Drag and drop PDF files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Supports PDF files from all major reverse distributors
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected Files ({files.length})</p>
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-teal-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Email Forward */}
            {uploadSource === 'email_forward' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Email Integration</CardTitle>
                  <CardDescription>Forward emails from reverse distributors automatically</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>How it works:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Set up email forwarding in your settings</li>
                      <li>Forward credit report emails to our system</li>
                      <li>Documents are automatically processed</li>
                    </ol>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full">
                      Configure Email Integration
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Portal Fetch */}
            {uploadSource === 'portal_fetch' && (
              <Card className="border-2 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-base">Portal Auto-Fetch</CardTitle>
                  <CardDescription>Automatically fetch documents from distributor portals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>How it works:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Add your portal credentials in settings</li>
                      <li>System automatically logs in and fetches reports</li>
                      <li>Documents are processed automatically</li>
                    </ol>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full">
                      Manage Portal Credentials
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-3">
            <Card className="border-2 border-cyan-200">
              <CardHeader>
                <CardTitle className="text-base">Supported Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>PDF Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Multiple file upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>All major distributors</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="text-base">Processing Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Uploading</span>
                    <Badge variant="info">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Processing</span>
                    <Badge variant="info">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed</span>
                    <Badge variant="success">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Needs Review</span>
                    <Badge variant="warning">Manual</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

