/**
 * API layer — all fetch functions used by React Query.
 * Integrated with Paystack API for real transaction processing.
 * Maintains MSW fallback for development when VITE_USE_MOCK=true.
 */

import { paystackConfig } from './config/paystackConfig';
import { getTransactionService } from './services/transactionService';
import { getCustomerService } from './services/customerService';

// Types
export interface TransactionFilters {
  perPage?: number;
  page?: number;
  from?: string;
  to?: string;
  customer?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerFilters {
  perPage?: number;
  page?: number;
  search?: string;
}

export interface CustomerData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface TransactionData {
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  description?: string;
  callbackUrl?: string;
  channels?: string[];
  metadata?: Record<string, any>;
}

export interface TransferData {
  amount: number;
  recipient: string;
  reason?: string;
  currency?: string;
}

export interface ExchangeRateResponse {
  rates: Record<string, number>;
  lastUpdated: string;
  base: string;
  timestamp: number;
  disclaimer?: string;
  license?: string;
  updateStatus?: {
    isStale: boolean;
    hoursSinceUpdate: number;
    lastUpdated: string;
    nextUpdate: string;
  };
}

export interface ConversionResult {
  success: boolean;
  result: number;
  rate: number;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    rate: number;
    timestamp: number;
  };
}

export interface TransactionStatistics {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  totalAmount: number;
  averageAmount: number;
}

export interface PaginationMeta {
  perPage: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  status: boolean;
  message: string;
}

// Legacy MSW support (for development)
const BASE = '';

async function apiFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

/**
 * Transaction API Functions
 * Integrated with Paystack API
 */

export async function fetchTransactions(filters: TransactionFilters = {}): Promise<any[]> {
  // Use Paystack API if not in mock mode
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    const result = await transactionService.fetchTransactions(filters);
    return result.transactions;
  }

  // Fallback to MSW for development
  const data = await apiFetch('/api/transactions');
  return data.transactions;
}

export async function fetchTransaction(id: string): Promise<any> {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.fetchTransaction(id);
  }

  // MSW fallback (implement if needed)
  return apiFetch(`/api/transactions/${id}`);
}

export async function verifyTransaction(reference: string): Promise<any> {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.verifyTransaction(reference);
  }

  // MSW fallback
  return apiFetch(`/api/transactions/verify/${reference}`);
}

export async function initializeTransaction(transactionData: TransactionData): Promise<any> {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.initializeTransaction(transactionData);
  }

  // MSW fallback
  return apiFetch('/api/transactions/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionData),
  });
}

/**
 * Customer API Functions
 * Integrated with Paystack API (POST/PUT /customer)
 */

export async function fetchCustomers(filters: CustomerFilters = {}): Promise<any[]> {
  // Use Paystack API if not in mock mode
  if (!paystackConfig.useMock) {
    const customerService = getCustomerService();
    const result = await customerService.fetchCustomers(filters);
    return result.customers;
  }

  // Fallback to MSW for development
  const data = await apiFetch('/api/customers');
  return data.customers;
}

export async function fetchCustomer(id: string): Promise<any> {
  if (!paystackConfig.useMock) {
    const customerService = getCustomerService();
    return await customerService.fetchCustomer(id);
  }

  // MSW fallback
  return apiFetch(`/api/customers/${id}`);
}

export async function createCustomer(customerData: CustomerData): Promise<any> {
  if (!paystackConfig.useMock) {
    const customerService = getCustomerService();
    return await customerService.createCustomer(customerData);
  }

  // MSW fallback
  const data = await apiFetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  return data.customer;
}

export async function updateCustomer(id: string, customerData: Partial<CustomerData>): Promise<any> {
  if (!paystackConfig.useMock) {
    const customerService = getCustomerService();
    return await customerService.updateCustomer(id, customerData);
  }

  // MSW fallback
  const data = await apiFetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  return data.customer;
}

/**
 * Balance API Functions
 * Currently using MSW, to be integrated with Paystack in future phases
 */

export async function fetchBalance(): Promise<any> {
  // Paystack doesn't have a direct balance API
  // This will be implemented with custom backend service
  // For now, use MSW
  return apiFetch('/api/balance');
}

/**
 * Transfer API Functions
 * Will be integrated with Paystack in Phase 4
 */

export async function sendTransfer(transferData: TransferData): Promise<any> {
  // Paystack transfer integration coming in Phase 4
  // For now, use MSW
  return apiFetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData),
  });
}

/**
 * Savings API Functions
 * Currently using MSW, to be integrated with Paystack plans in Phase 5
 */

export async function fetchSavings(): Promise<any[]> {
  // Will be integrated with Paystack plans in Phase 5
  const data = await apiFetch('/api/savings');
  return data.plans;
}

/**
 * Exchange Rate API Functions
 * Integrated with OpenExchangeRates API for real-time rates
 */

import { getExchangeRateService } from './services/exchangeRateService';

export async function fetchRates(): Promise<ExchangeRateResponse> {
  // Use OpenExchangeRates API for real rates
  try {
    const exchangeRateService = getExchangeRateService();
    const result = await exchangeRateService.fetchLatestRates('NGN');

    return {
      rates: result.rates,
      lastUpdated: result.lastUpdated,
      base: result.base,
      timestamp: result.timestamp,
      disclaimer: result.disclaimer,
      license: result.license,
      updateStatus: result.updateStatus,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback to MSW if OpenExchangeRates fails
    const data = await apiFetch('/api/rates');
    return data;
  }
}

/**
 * Convert currency using OpenExchangeRates API
 * @param amount - Amount to convert
 * @param from - Source currency
 * @param to - Target currency
 * @returns Conversion result
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult> {
  try {
    const exchangeRateService = getExchangeRateService();
    const result = await exchangeRateService.convertCurrency(amount, from, to);
    return result;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
}

/**
 * Insights API Functions
 * Currently using MSW, to be integrated with transaction statistics
 */

export async function fetchInsights(): Promise<any[]> {
  // Can be implemented using Paystack transaction statistics
  const data = await apiFetch('/api/insights');
  return data.insights;
}

/**
 * Transaction Statistics
 * New function using Paystack API
 */

export async function fetchTransactionStatistics(filters: TransactionFilters = {}): Promise<TransactionStatistics> {
  if (!paystackConfig.useMock) {
    const transactionService = getTransactionService();
    return await transactionService.getTransactionStatistics(filters);
  }

  // MSW fallback
  return apiFetch('/api/transactions/statistics');
}
