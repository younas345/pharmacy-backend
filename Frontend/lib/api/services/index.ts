/**
 * API Services Index
 * Central export for all API services
 */

export { authService } from './authService';
export { inventoryService } from './inventoryService';
export { returnsService } from './returnsService';
export { productsService } from './productsService';
export { productListsService } from './productListsService';
export { dashboardService } from './dashboardService';
export { creditsService } from './creditsService';
export { documentsService } from './documentsService';

// Re-export types
export type { SignupData, SigninData, AuthResponse } from './authService';
export type { CreateInventoryItemRequest, UpdateInventoryItemRequest, InventoryFilters, InventoryMetrics } from './inventoryService';
export type { CreateReturnRequest, UpdateReturnRequest, ReturnsFilters } from './returnsService';
export type { ValidateNDCResponse, CreateProductRequest } from './productsService';
export type { ProductList, ProductListItem } from './productListsService';
export type { DashboardSummary } from './dashboardService';
export type { CreditEstimateItem, CreditEstimate } from './creditsService';
export type { DocumentsFilters } from './documentsService';

