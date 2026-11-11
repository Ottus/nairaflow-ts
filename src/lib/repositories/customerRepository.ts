/**
 * Customer Repository
 * Handles all customer-related API calls to Paystack
 */

import { getPaystackClient, PaystackClient } from '../paystackClient';
import { CustomerAdapter } from '../adapters/customerAdapter';

export interface CustomerFilters {
  perPage?: number;
  page?: number;
  search?: string;
}

export interface CustomerData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata?: Record<string, any>;
  first_name?: string;
  last_name?: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  metadata: Record<string, any>;
  risk_action: string;
  international_phone_format: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  initial: string;
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

class CustomerRepository {
  private client: PaystackClient;

  constructor(client: PaystackClient | null = null) {
    this.client = client || getPaystackClient();
  }

  /**
   * List all customers with optional filters
   * @param filters - Query parameters for filtering
   * @param filters.perPage - Number of results per page
   * @param filters.page - Page number to retrieve
   * @returns Paginated customer list
   */
  async listCustomers(filters: CustomerFilters = {}): Promise<RepositoryResponse<Customer[]>> {
    const response = await this.client.get('/customer', filters);

    return {
      data: CustomerAdapter.fromPaystackArray(response.data),
      meta: CustomerAdapter.extractPagination(response),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Get a single customer by ID, customer code or email
   * @param id - Customer ID, customer code (CUS_xxx) or email
   * @returns Customer details
   */
  async getCustomer(id: string): Promise<RepositoryResponse<Customer>> {
    const response = await this.client.get(`/customer/${id}`);

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Create a new customer
   * @param customerData - Customer data
   * @param customerData.email - Customer email (required by Paystack)
   * @param customerData.firstName - First name
   * @param customerData.lastName - Last name
   * @param customerData.phone - Phone number
   * @param customerData.metadata - Additional metadata
   * @returns Created customer
   */
  async createCustomer(customerData: CustomerData): Promise<RepositoryResponse<Customer>> {
    const payload = CustomerAdapter.toPaystackCreate(customerData);
    const response = await this.client.post('/customer', payload);

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Update an existing customer
   * @param id - Customer ID or customer code (CUS_xxx)
   * @param customerData - Fields to update
   * @returns Updated customer
   */
  async updateCustomer(id: string, customerData: CustomerData): Promise<RepositoryResponse<Customer>> {
    const payload = CustomerAdapter.toPaystackUpdate(customerData);
    const response = await this.client.put(`/customer/${id}`, payload);

    return {
      data: CustomerAdapter.fromPaystack(response.data),
      status: response.status,
      message: response.message,
    };
  }

  /**
   * Search customers by query string
   * @param query - Search query
   * @returns Search results
   */
  async searchCustomers(query: string): Promise<RepositoryResponse<Customer[]>> {
    const response = await this.client.get('/customer', { search: query });

    return {
      data: CustomerAdapter.fromPaystackArray(response.data),
      meta: CustomerAdapter.extractPagination(response),
      status: response.status,
      message: response.message,
    };
  }
}

/**
 * Create a singleton instance of the customer repository
 */
let customerRepositoryInstance: CustomerRepository | null = null;

export function getCustomerRepository(): CustomerRepository {
  if (!customerRepositoryInstance) {
    customerRepositoryInstance = new CustomerRepository();
  }
  return customerRepositoryInstance;
}

/**
 * Create a new customer repository instance (for testing or custom config)
 */
export function createCustomerRepository(client: PaystackClient): CustomerRepository {
  return new CustomerRepository(client);
}

export default CustomerRepository;
