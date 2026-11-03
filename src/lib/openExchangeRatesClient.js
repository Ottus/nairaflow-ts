/**
 * OpenExchangeRates API Client
 * Handles all HTTP requests to OpenExchangeRates API
 */

class OpenExchangeRatesClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.appId = config.appId;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Build URL with query parameters
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add app_id to all requests
    url.searchParams.append('app_id', this.appId);
    
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
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
  }

  /**
   * Make HTTP request to OpenExchangeRates API
   */
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint, options.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const config = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Remove params from config as they're already in URL
    delete config.params;

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

      if (error.name === 'AbortError') {
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
  async get(endpoint, params = {}) {
    return this.request(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * Check if client is properly configured
   */
  isConfigured() {
    return !!(this.appId && this.baseURL);
  }
}

/**
 * Create a singleton instance of the OpenExchangeRates client
 */
let clientInstance = null;

export function getOpenExchangeRatesClient() {
  if (!clientInstance) {
    const config = {
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
export function createOpenExchangeRatesClient(config) {
  return new OpenExchangeRatesClient(config);
}

export default OpenExchangeRatesClient;