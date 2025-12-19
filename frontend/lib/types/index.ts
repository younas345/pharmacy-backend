// Core Type Definitions for PharmAdmin

export interface Pharmacy {
    id: string;
    businessName: string;
    owner: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    licenseNumber: string;
    licenseExpiry: string;
    status: 'active' | 'suspended' | 'blacklisted';
    joinDate: string;
    totalReturns: number;
    monthlyReturns: number;
}

export interface Payment {
    id: string;
    pharmacy: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
    date: string;
    method: string;
    transactionId: string;
    description: string;
}

export interface DashboardStats {
    totalPharmacies: number;
    activeDistributors: number;
    pendingDocuments: number;
    returnsValue: number;
    pharmaciesChange: number;
    distributorsChange: number;
    documentsChange: number;
    returnsChange: number;
}
