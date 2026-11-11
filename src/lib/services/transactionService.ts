/**
 * Transaction Service
 * Business logic layer for transaction operations
 */

import { getTransactionRepository, TransactionRepository, Transaction, TransactionFilters, TransactionData, PaginationMeta } from '../repositories/transactionRepository';
import { TransactionAdapter } from '../adapters/transactionAdapter';
import { paystackConfig } from '../config/paystackConfig';

export interface TransactionStatistics {
  total: number;
  totalAmount: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  averageAmount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class TransactionService {
  private repository: TransactionRepository;

  constructor(repository: TransactionRepository | null = null) {
    this.repository = repository || getTransactionRepository();
  }

  /**
   * Fetch all transactions with optional filtering
   * @param filters - Filter options
   * @param filters.status - Filter by status
   * @param filters.customer - Filter by customer
   * @param filters.from - Start date
   * @param filters.to - End date
   * @param filters.perPage - Results per page
   * @param filters.page - Page number
   * @returns Filtered transactions
   */
  async fetchTransactions(filters: TransactionFilters = {}): Promise<{ transactions: Transaction[]; pagination: PaginationMeta; statistics: TransactionStatistics }> {
    try {
      const response = await this.repository.listTransactions(filters);

      // Apply additional client-side filtering if needed
      let transactions: Transaction[] = response.data;

      if (filters.status) {
        transactions = TransactionAdapter.filterByStatus(transactions, filters.status);
      }

      if (filters.startDate && filters.endDate) {
        transactions = TransactionAdapter.filterByDateRange(
          transactions,
          filters.startDate,
          filters.endDate
        );
      }

      return {
        transactions,
        pagination: response.meta || { perPage: 50, page: 1, total: 0, totalPages: 0 },
        statistics: TransactionAdapter.calculateStatistics(transactions),
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch a single transaction by ID
   * @param id - Transaction ID
   * @returns Transaction details
   */
  async fetchTransaction(id: string): Promise<Transaction> {
    try {
      const response = await this.repository.getTransaction(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Verify a transaction by reference
   * @param reference - Transaction reference
   * @returns Verification result
   */
  async verifyTransaction(reference: string): Promise<Transaction> {
    try {
      const response = await this.repository.verifyTransaction(reference);
      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Initialize a new transaction
   * @param transactionData - Transaction data
   * @param transactionData.email - Customer email
   * @param transactionData.amount - Amount in kobo
   * @param transactionData.currency - Currency code
   * @param transactionData.description - Transaction description
   * @param transactionData.reference - Unique reference
   * @param transactionData.metadata - Additional metadata
   * @param transactionData.callbackUrl - Callback URL
   * @returns Initialization result
   */
  async initializeTransaction(transactionData: TransactionData): Promise<any> {
    try {
      // Validate required fields
      if (!transactionData.email) {
        throw new Error('Email is required');
      }

      if (!transactionData.amount || transactionData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Generate reference if not provided
      if (!transactionData.reference) {
        transactionData.reference = this.generateReference();
      }

      const response = await this.repository.initializeTransaction(transactionData);
      return response.data;
    } catch (error) {
      console.error('Error initializing transaction:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   * @param limit - Number of transactions to fetch
   * @returns Recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<{ transactions: Transaction[]; statistics: TransactionStatistics }> {
    try {
      const response = await this.repository.getRecentTransactions(limit);
      return {
        transactions: response.data,
        statistics: TransactionAdapter.calculateStatistics(response.data),
      };
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   * @param filters - Optional filters
   * @returns Transaction statistics
   */
  async getTransactionStatistics(filters: TransactionFilters = {}): Promise<TransactionStatistics> {
    try {
      const response = await this.repository.getTransactionTotals(filters);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction statistics:', error);
      throw error;
    }
  }

  /**
   * Get transaction timeline
   * @param id - Transaction ID
   * @returns Transaction timeline
   */
  async getTransactionTimeline(id: string): Promise<any> {
    try {
      const response = await this.repository.getTransactionTimeline(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction timeline:', error);
      throw error;
    }
  }

  /**
   * Search transactions
   * @param query - Search query
   * @returns Search results
   */
  async searchTransactions(query: string): Promise<{ transactions: Transaction[]; count: number }> {
    try {
      const response = await this.repository.searchTransactions(query);
      return {
        transactions: response.data,
        count: response.data.length,
      };
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction reference
   * @returns Unique reference
   */
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `nairaflow_${timestamp}_${random}`;
  }

  /**
   * Format amount for display
   * @param amount - Amount in kobo
   * @param currency - Currency code
   * @returns Formatted amount
   */
  formatAmount(amount: number, currency: string = 'NGN'): string {
    const naira = amount / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(naira);
  }

  /**
   * Validate transaction data
   * @param transactionData - Transaction data to validate
   * @returns Validation result
   */
  validateTransactionData(transactionData: TransactionData): ValidationResult {
    const errors: string[] = [];

    if (!transactionData.email) {
      errors.push('Email is required');
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (transactionData.amount && transactionData.amount > 1000000000) { // Max 10 million naira
      errors.push('Amount exceeds maximum limit');
    }

    if (transactionData.currency && !['NGN', 'USD', 'GBP', 'EUR', 'CAD'].includes(transactionData.currency)) {
      errors.push('Invalid currency code');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if transaction is refundable
   * @param transaction - Transaction to check
   * @returns Whether transaction can be refunded
   */
  isRefundable(transaction: Transaction): boolean {
    // Only successful transactions can be refunded
    if (transaction.status !== 'success') {
      return false;
    }

    // Check if transaction is within refund window (24 hours)
    const transactionDate = new Date(transaction.paid_at || transaction.date);
    const now = new Date();
    const hoursSinceTransaction = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);

    return hoursSinceTransaction <= 24;
  }

  /**
   * Calculate refund amount (with fees)
   * @param transaction - Transaction to calculate refund for
   * @returns Refund amount in kobo
   */
  calculateRefundAmount(transaction: Transaction): number {
    // Paystack charges 1.5% + ₦100 fee
    const paystackFee = Math.max(transaction.amount * 0.015 + 10000, 10000);
    return transaction.amount - paystackFee;
  }

  /**
   * Get transactions for a specific customer
   * @param customerId - Customer ID or email
   * @param filters - Additional filters
   * @returns Customer transactions
   */
  async getCustomerTransactions(customerId: string, filters: TransactionFilters = {}): Promise<{ transactions: Transaction[]; pagination: PaginationMeta; statistics: TransactionStatistics }> {
    try {
      const response = await this.repository.getCustomerTransactions(customerId, filters);
      return {
        transactions: response.data,
        pagination: response.meta || { perPage: 50, page: 1, total: 0, totalPages: 0 },
        statistics: TransactionAdapter.calculateStatistics(response.data),
      };
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      throw error;
    }
  }

  /**
   * Batch fetch transactions with pagination
   * @param options - Pagination options
   * @param options.maxPages - Maximum pages to fetch
   * @param options.filters - Filter options
   * @returns All transactions
   */
  async fetchAllTransactions(options: { maxPages?: number; filters?: TransactionFilters } = {}): Promise<Transaction[]> {
    const { maxPages = 10, filters = {} } = options;
    const allTransactions: Transaction[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      const response = await this.repository.listTransactions({
        ...filters,
        page: currentPage,
        perPage: 50,
      });

      allTransactions.push(...response.data);
      hasMore = currentPage < (response.meta?.totalPages || 0);
      currentPage++;
    }

    return allTransactions;
  }
}

/**
 * Create a singleton instance of the transaction service
 */
let transactionServiceInstance: TransactionService | null = null;

export function getTransactionService(): TransactionService {
  if (!transactionServiceInstance) {
    transactionServiceInstance = new TransactionService();
  }
  return transactionServiceInstance;
}

/**
 * Create a new transaction service instance (for testing or custom config)
 */
export function createTransactionService(repository: TransactionRepository): TransactionService {
  return new TransactionService(repository);
}

export default TransactionService;
