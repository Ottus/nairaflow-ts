/**
 * Customer Adapter
 * Transforms Paystack API responses to our application's data structure
 */

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
  risk_action?: string;
  international_phone_format?: string;
  created_at: string;
  updated_at?: string;
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

export interface AppCustomer {
  email: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface PaginationMeta {
  perPage: number;
  page: number;
  total: number;
  totalPages: number;
}

export class CustomerAdapter {
  /**
   * Transform Paystack customer to our app's customer format
   */
  static fromPaystack(paystackCustomer: PaystackCustomer): Customer {
    return {
      id: paystackCustomer.id,
      customer_code: paystackCustomer.customer_code,
      email: paystackCustomer.email || '',
      firstName: paystackCustomer.first_name || '',
      lastName: paystackCustomer.last_name || '',
      phone: paystackCustomer.phone || '',
      metadata: paystackCustomer.metadata || {},
      risk_action: paystackCustomer.risk_action || 'default',
      international_phone_format: paystackCustomer.international_phone_format || '',
      createdAt: paystackCustomer.created_at,
      updatedAt: paystackCustomer.updated_at || paystackCustomer.created_at,
      fullName: this.getFullName(paystackCustomer),
      initial: this.getInitial(paystackCustomer),
    };
  }

  /**
   * Transform array of Paystack customers
   */
  static fromPaystackArray(paystackCustomers: PaystackCustomer[]): Customer[] {
    return (paystackCustomers || []).map(customer => this.fromPaystack(customer));
  }

  /**
   * Build full display name
   */
  static getFullName(customer: PaystackCustomer): string {
    return [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unnamed Customer';
  }

  /**
   * Build avatar initial
   */
  static getInitial(customer: PaystackCustomer): string {
    const first = (customer.first_name || customer.email || '?').charAt(0);
    const last = (customer.last_name || '').charAt(0);
    return (first + last).toUpperCase() || '?';
  }

  /**
   * Transform our app's customer to Paystack format (create)
   */
  static toPaystackCreate(appCustomer: AppCustomer): Record<string, any> {
    return {
      email: appCustomer.email,
      first_name: appCustomer.firstName || appCustomer.first_name,
      last_name: appCustomer.lastName || appCustomer.last_name,
      phone: appCustomer.phone || undefined,
      metadata: appCustomer.metadata && Object.keys(appCustomer.metadata).length > 0
        ? appCustomer.metadata
        : undefined,
    };
  }

  /**
   * Transform our app's customer to Paystack format (update)
   * Paystack ignores empty strings on update, so we only send provided fields
   */
  static toPaystackUpdate(appCustomer: Partial<AppCustomer>): Record<string, any> {
    const payload: Record<string, any> = {};

    if (appCustomer.email) payload.email = appCustomer.email;
    if (appCustomer.firstName ?? appCustomer.first_name) {
      payload.first_name = appCustomer.firstName ?? appCustomer.first_name;
    }
    if (appCustomer.lastName ?? appCustomer.last_name) {
      payload.last_name = appCustomer.lastName ?? appCustomer.last_name;
    }
    if (appCustomer.phone) payload.phone = appCustomer.phone;
    if (appCustomer.metadata && Object.keys(appCustomer.metadata).length > 0) {
      payload.metadata = appCustomer.metadata;
    }

    return payload;
  }

  /**
   * Extract pagination metadata from Paystack response
   */
  static extractPagination(paystackResponse: any): PaginationMeta {
    return {
      perPage: paystackResponse.meta?.per_page || 50,
      page: paystackResponse.meta?.page || 1,
      total: paystackResponse.meta?.total || 0,
      totalPages: paystackResponse.meta?.total_pages || 0,
    };
  }

  /**
   * Filter customers by free-text search (name, email or customer code)
   */
  static search(customers: Customer[], query: string): Customer[] {
    if (!query) return customers;
    const q = query.toLowerCase().trim();
    return customers.filter(customer =>
      customer.fullName.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      (customer.customer_code || '').toLowerCase().includes(q) ||
      (customer.phone || '').includes(q)
    );
  }
}
