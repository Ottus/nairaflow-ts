/**
 * OpenExchangeRates API Client
 * Handles all HTTP requests to OpenExchangeRates API
 */

import { PaystackError } from './errors/PaystackError';

export interface OpenExchangeRatesConfig {
  baseURL: string;
  appId?: string;
  timeout?: number;
}

export interface RequestOptions {
  method?: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: string;
}

class OpenExchangeRatesClient {
  private baseURL: string;
  private appId: string | undefined;
  private timeout: number;

  constructor(config: OpenExchangeRatesConfig) {
    this.baseURL = config.baseURL;
    this.appId = config.appId;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add app_id to all requests
    if (this.appId) {
      url.searchParams.append('app_id', this.appId);
    }

    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
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
   * Make HTTP request to OpenExchangeRates API
   */
  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = this.buildURL(endpoint, options.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
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
        throw new PaystackError(
          errorData.message || 'OpenExchangeRates API request failed',
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new PaystackError('Request timeout', 408);
      }

      // if (error instanceof PaystackError) {
      //   throw error;
      // }

      // throw new PaystackError(
      //   error.message || 'Network error occurred',
      //   null,
      //   { message: error.message }
      // );
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
   * Check if client is properly configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.baseURL);
  }
}

/**
 * Create a singleton instance of the OpenExchangeRates client
 */
let clientInstance: OpenExchangeRatesClient | null = null;

export function getOpenExchangeRatesClient(): OpenExchangeRatesClient {
  if (!clientInstance) {
    const config: OpenExchangeRatesConfig = {
      baseURL: import.meta.env.VITE_OPENEXCHANGERATES_BASE_URL || 'https://openexchangerates.org/api',
      appId: import.meta.env.VITE_OPENEXCHANGERATES_APP_ID,
      timeout: 30000,
    };
    clientInstance = new OpenExchangeRatesClient(config);
  }

  if (!clientInstance.isConfigured()) {
    console.warn('OpenExchangeRates client is not properly configured');
  }

  return clientInstance;
}

/**
 * Create a new OpenExchangeRates client instance (for testing or custom config)
 */
export function createOpenExchangeRatesClient(config: OpenExchangeRatesConfig): OpenExchangeRatesClient {
  return new OpenExchangeRatesClient(config);
}

export default OpenExchangeRatesClient;
