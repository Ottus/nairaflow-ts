/**
 * Paystack API Client
 * Handles all HTTP requests to Paystack API with authentication and error handling
 */

import { paystackConfig, validateConfig, PaystackConfig } from './config/paystackConfig';
import { PaystackError } from './errors/PaystackError';

export interface RequestOptions {
  method?: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: string;
}

class PaystackClient {
  private config: PaystackConfig;
  private baseURL: string;
  private secretKey: string | undefined;
  private timeout: number;

  constructor(config: PaystackConfig = paystackConfig) {
    this.config = config;
    this.baseURL = config.baseURL;
    this.secretKey = config.secretKey;
    this.timeout = config.timeout;
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any> | undefined): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return `?${searchParams.toString()}`;
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params: Record<string, any> = {}): string {
    const queryString = this.buildQueryString(params);
    return `${this.baseURL}${endpoint}${queryString}`;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  /**
   * Make HTTP request to Paystack API
   */
  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = this.buildURL(endpoint, options.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Remove params from config as they're already in URL
    delete (config as any).params;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw PaystackError.fromResponse({
          status: response.status,
          data: errorData,
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new PaystackError('Request timeout', 408);
      }

      if (error instanceof PaystackError) {
        throw error;
      }

      throw new PaystackError(
        error instanceof Error ? error.message : 'Network error occurred',
        null,
        { message: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * GET request
   */
  async get(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   */
  async post(endpoint: string, data: Record<string, any> = {}, params: Record<string, any> = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      params,
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint: string, data: Record<string, any> = {}, params: Record<string, any> = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      params,
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'DELETE',
      params,
    });
  }

  /**
   * Check if client is properly configured
   */
  isConfigured(): boolean {
    try {
      validateConfig();
      return true;
    } catch (error) {
      console.error('Paystack client configuration error:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

/**
 * Create a singleton instance of the Paystack client
 */
let clientInstance: PaystackClient | null = null;

export function getPaystackClient(): PaystackClient {
  if (!clientInstance) {
    clientInstance = new PaystackClient();
  }

  if (!clientInstance.isConfigured()) {
    console.warn('Paystack client is not properly configured');
  }

  return clientInstance;
}

/**
 * Create a new Paystack client instance (for testing or custom config)
 */
export function createPaystackClient(config: PaystackConfig): PaystackClient {
  return new PaystackClient(config);
}

export default PaystackClient;
