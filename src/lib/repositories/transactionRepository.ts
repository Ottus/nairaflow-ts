/**
 * Transaction Repository
 * Handles all transaction-related API calls to Paystack
 */

import { getPaystackClient, PaystackClient } from '../paystackClient';
import { TransactionAdapter } from '../adapters/transactionAdapter';

export interface TransactionFilters {
  perPage?: number;
  page?: number;
  from?: string;
  to?: string;
  customer?: string;
  status?: string;
  amount?: number;
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
  bank?: string;
  account?: string;
  customFields?: Record<string, any>;
}

export interface ChargeData {
  reference: string;
  authorization_code: string;
  email: string;
  amount: number;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  currency: string;
  status: string;
  bank: string;
  account: string;
  date: string;
  fee: number;
  reference: string;
  customer: any;
  metadata: Record<string, any>;
  gateway_response: string;
  channel: string;
  paid_at?: string;
}

export interface PaginationMeta {
  perPage: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface RepositoryResponse<T> {
  data: T;
  meta?: PaginationMeta;
  status: boolean;
  message: string;
}

class TransactionRepository {
  private client: PaystackClient;

  constructor(client: PaystackClient | null = null) {
    this.client = client || getPaystackClient();
  }

  /**
   * List all transactions with optional filters
   * @param filters - Query parameters for filtering
   * @param filters.perPage - Number of results per page
   * @param filters.page - Page number to retrieve
   * @param filters.from - Start date to filter transactions
   * @param filters.to - End date to filter transactions
   * @param filters.customer - Customer ID to filter
   * @param filters.status - Transaction status to filter
   * @returns Paginated transaction list
   */
  async listTransactions(filters: TransactionFilters = {}): Promise<RepositoryResponse<Transaction[]>> {
    const response = await this.client.get('/transaction', filters);

    return {
      data: TransactionAdapter.fromPaystackArray(response.data),
      meta: TransactionAdapter.extractPagination(response),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get a single transaction by ID
   * @param id - Transaction ID
   * @returns Transaction details
   */
  async getTransaction(id: string): Promise<RepositoryResponse<Transaction>> {
    const response = await this.client.get(`/transaction/${id}`);

    return {
      data: TransactionAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Verify a transaction using its reference
   * @param reference - Transaction reference
   * @returns Verification result
   */
  async verifyTransaction(reference: string): Promise<RepositoryResponse<Transaction>> {
    const response = await this.client.get(`/transaction/verify/${reference}`);

    return {
      data: TransactionAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Initialize a transaction
   * @param transactionData - Transaction initialization data
   * @param transactionData.email - Customer email
   * @param transactionData.amount - Amount in kobo
   * @param transactionData.currency - Currency code
   * @param transactionData.reference - Unique transaction reference
   * @param transactionData.metadata - Additional metadata
   * @param transactionData.callbackUrl - URL for Paystack callback
   * @param transactionData.channels - Payment channels to use
   * @returns Initialization result with payment URL
   */
  async initializeTransaction(transactionData: TransactionData): Promise<RepositoryResponse<any>> {
    const payload = TransactionAdapter.toPaystackInitialize(transactionData);
    const response = await this.client.post('/transaction/initialize', payload);

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Charge an existing authorization
   * @param chargeData - Authorization charge data
   * @param chargeData.reference - Transaction reference
   * @param chargeData.authorization_code - Authorization code
   * @param chargeData.email - Customer email
   * @param chargeData.amount - Amount in kobo
   * @returns Charge result
   */
  async chargeAuthorization(chargeData: ChargeData): Promise<RepositoryResponse<any>> {
    const response = await this.client.post('/transaction/charge_authorization', chargeData);

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * View transaction timeline
   * @param id - Transaction ID
   * @returns Transaction timeline
   */
  async getTransactionTimeline(id: string): Promise<RepositoryResponse<any>> {
    const response = await this.client.get(`/transaction/timeline/${id}`);

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get totals for transactions
   * @param filters - Filter parameters
   * @returns Transaction totals
   */
  async getTransactionTotals(filters: TransactionFilters = {}): Promise<RepositoryResponse<any>> {
    const response = await this.client.get('/transaction/totals', filters);

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Export transactions
   * @param filters - Filter parameters
   * @param filters.from - Start date
   * @param filters.to - End date
   * @param filters.customer - Customer ID
   * @param filters.status - Transaction status
   * @returns Export result with download URL
   */
  async exportTransactions(filters: TransactionFilters = {}): Promise<RepositoryResponse<any>> {
    const response = await this.client.get('/transaction/export', filters);

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get partial debit transactions
   * @returns Partial debit transactions
   */
  async getPartialDebits(): Promise<RepositoryResponse<any>> {
    const response = await this.client.get('/transaction/partial_debit');

    return {
      data: response.data,
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Search transactions by reference
   * @param query - Search query
   * @returns Search results
   */
  async searchTransactions(query: string): Promise<RepositoryResponse<Transaction[]>> {
    const response = await this.client.get('/transaction/search', { query });

    return {
      data: TransactionAdapter.fromPaystackArray(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get recent transactions (convenience method)
   * @param limit - Number of recent transactions to fetch
   * @returns Recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<RepositoryResponse<Transaction[]>> {
    return this.listTransactions({
      perPage: limit,
      page: 1,
    });
  }

  /**
   * Get transactions for a specific customer
   * @param customerId - Customer ID or email
   * @param filters - Additional filters
   * @returns Customer transactions
   */
  async getCustomerTransactions(customerId: string, filters: TransactionFilters = {}): Promise<RepositoryResponse<Transaction[]>> {
    return this.listTransactions({
      ...filters,
      customer: customerId,
    });
  }

  /**
   * Get transactions by date range
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param filters - Additional filters
   * @returns Transactions in date range
   */
  async getTransactionsByDateRange(startDate: string, endDate: string, filters: TransactionFilters = {}): Promise<RepositoryResponse<Transaction[]>> {
    return this.listTransactions({
      ...filters,
      from: startDate,
      to: endDate,
    });
  }

  /**
   * Get transactions by status
   * @param status - Transaction status
   * @param filters - Additional filters
   * @returns Transactions with specified status
   */
  async getTransactionsByStatus(status: string, filters: TransactionFilters = {}): Promise<RepositoryResponse<Transaction[]>> {
    return this.listTransactions({
      ...filters,
      status,
    });
  }
}

/**
 * Create a singleton instance of the transaction repository
 */
let transactionRepositoryInstance: TransactionRepository | null = null;

export function getTransactionRepository(): TransactionRepository {
  if (!transactionRepositoryInstance) {
    transactionRepositoryInstance = new TransactionRepository();
  }
  return transactionRepositoryInstance;
}

/**
 * Create a new transaction repository instance (for testing or custom config)
 */
export function createTransactionRepository(client: PaystackClient): TransactionRepository {
  return new TransactionRepository(client);
}

export default TransactionRepository;
