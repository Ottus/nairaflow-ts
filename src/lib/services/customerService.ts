/**
 * Customer Service
 * Business logic layer for customer operations
 */

import { getCustomerRepository, CustomerRepository, CustomerData, Customer, PaginationMeta } from '../repositories/customerRepository';
import { CustomerAdapter } from '../adapters/customerAdapter';
import {
  validateCustomerCreate,
  validateCustomerUpdate,
  validateCustomerFilters,
  formatValidationErrors,
} from '../validators/customerValidator';

export interface CustomerFilters {
  search?: string;
  perPage?: number;
  page?: number;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: any[];
}

class CustomerService {
  private repository: CustomerRepository;

  constructor(repository: CustomerRepository | null = null) {
    this.repository = repository || getCustomerRepository();
  }

  /**
   * Fetch all customers with optional filtering
   * @param filters - Filter options
   * @param filters.search - Free-text search (name, email, code)
   * @param filters.perPage - Results per page
   * @param filters.page - Page number
   * @returns Filtered customers with pagination
   */
  async fetchCustomers(filters: CustomerFilters = {}): Promise<{ customers: Customer[]; pagination: PaginationMeta }> {
    try {
      const { search, ...query } = filters;

      const validation: ValidationResult = validateCustomerFilters(query);
      if (!validation.success) {
        throw new Error(formatValidationErrors(validation.errors || [])[0]?.message || 'Invalid filters');
      }

      const response = await this.repository.listCustomers(query);

      let customers: Customer[] = response.data;
      if (search) {
        customers = CustomerAdapter.search(customers, search);
      }

      return {
        customers,
        pagination: response.meta || { perPage: 50, page: 1, total: 0, totalPages: 0 },
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Fetch a single customer by ID, customer code or email
   * @param id - Customer ID, customer code or email
   * @returns Customer details
   */
  async fetchCustomer(id: string): Promise<Customer> {
    try {
      const response = await this.repository.getCustomer(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   * @param customerData - Customer data (email, firstName, lastName, phone)
   * @returns Created customer
   */
  async createCustomer(customerData: CustomerData): Promise<Customer> {
    try {
      const validation: ValidationResult = validateCustomerCreate(customerData);
      if (!validation.success) {
        const errors = formatValidationErrors(validation.errors || []);
        throw new Error(errors[0]?.message || 'Invalid customer data');
      }

      const response = await this.repository.createCustomer(validation.data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   * @param id - Customer ID or customer code (CUS_xxx)
   * @param customerData - Fields to update
   * @returns Updated customer
   */
  async updateCustomer(id: string, customerData: CustomerData): Promise<Customer> {
    try {
      if (!id) {
        throw new Error('Customer ID is required for updates');
      }

      const validation: ValidationResult = validateCustomerUpdate(customerData);
      if (!validation.success) {
        const errors = formatValidationErrors(validation.errors || []);
        throw new Error(errors[0]?.message || 'Invalid customer data');
      }

      const response = await this.repository.updateCustomer(id, validation.data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Search customers by free-text query
   * @param query - Search query
   * @returns Search results
   */
  async searchCustomers(query: string): Promise<{ customers: Customer[]; count: number }> {
    try {
      const response = await this.repository.searchCustomers(query);
      return {
        customers: response.data,
        count: response.data.length,
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
}

/**
 * Create a singleton instance of the customer service
 */
let customerServiceInstance: CustomerService | null = null;

export function getCustomerService(): CustomerService {
  if (!customerServiceInstance) {
    customerServiceInstance = new CustomerService();
  }
  return customerServiceInstance;
}

/**
 * Create a new customer service instance (for testing or custom config)
 */
export function createCustomerService(repository: CustomerRepository): CustomerService {
  return new CustomerService(repository);
}

export default CustomerService;
