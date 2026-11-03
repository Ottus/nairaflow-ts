/**
 * OpenExchangeRates Repository
 * Handles all exchange rate API calls to OpenExchangeRates
 */

import { getOpenExchangeRatesClient } from '../openExchangeRatesClient.js';

class ExchangeRateRepository {
  constructor(client = null) {
    this.client = client || getOpenExchangeRatesClient();
  }

  /**
   * Get latest exchange rates with base currency
   * @param {string} base - Base currency (default: USD for free tier compatibility)
   * @returns {Promise<Object>} Exchange rates
   */
  async getLatestRates(base = 'USD') {
    // OpenExchangeRates free tier only supports USD as base currency
    // We'll request USD and convert client-side if needed
    const response = await this.client.get('/latest.json', { base: 'USD' });

    return {
      data: response,
      status: 200,
      message: 'Rates fetched successfully',
    };
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {Promise<Object>} Conversion result
   */
  async convertCurrency(amount, from, to) {
    const response = await this.client.get(`/convert/${amount}/${from}/${to}`);
    
    return {
      data: response,
      status: 200,
      message: 'Conversion successful',
    };
  }

  /**
   * Get historical exchange rates for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} base - Base currency (ignored for free tier, always USD)
   * @returns {Promise<Object>} Historical rates
   */
  async getHistoricalRates(date, base = 'NGN') {
    // OpenExchangeRates free tier only supports USD as base currency
    const response = await this.client.get(`/historical/${date}.json`, { base: 'USD' });

    return {
      data: response,
      status: 200,
      message: 'Historical rates fetched successfully',
    };
  }

  /**
   * Get time-series data for currency conversion
   * @param {string} start_date - Start date in YYYY-MM-DD
   * @param {string} end_date - End date in YYYY-MM-DD
   * @param {string} base - Base currency (ignored for free tier, always USD)
   * @param {string} symbols - Comma-separated list of symbols
   * @returns {Promise<Object>} Time-series data
   */
  async getTimeSeries(start_date, end_date, base = 'NGN', symbols = 'USD,GBP,EUR,CAD') {
    // OpenExchangeRates free tier only supports USD as base currency
    const response = await this.client.get('/timeseries', {
      start_date,
      end_date,
      base: 'USD',
      symbols,
    });

    return {
      data: response,
      status: 200,
      message: 'Time-series data fetched successfully',
    };
  }

  /**
   * Get currencies (available currencies on OpenExchangeRates)
   * @returns {Promise<Object>} Available currencies
   */
  async getCurrencies() {
    const response = await this.client.get('/currencies.json');
    
    return {
      data: response,
      status: 200,
      message: 'Currencies fetched successfully',
    };
  }

  /**
   * Get usage statistics for your API key
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsage() {
    const response = await this.client.get('/usage.json');
    
    return {
      data: response,
      status: 200,
      message: 'Usage statistics fetched successfully',
    };
  }

  /**
   * Get latest rates with filtering
   * @param {Object} filters - Filter options
   * @param {string} filters.base - Base currency (ignored for free tier, always USD)
   * @param {string} filters.symbols - Comma-separated list of currencies
   * @param {boolean} filters.show_alternative - Show alternative currencies
   * @returns {Promise<Object>} Filtered rates
   */
  async getFilteredRates(filters = {}) {
    // OpenExchangeRates free tier only supports USD as base currency
    const response = await this.client.get('/latest.json', {
      ...filters,
      base: 'USD',
    });

    return {
      data: response,
      status: 200,
      message: 'Filtered rates fetched successfully',
    };
  }

  /**
   * Convert with specific date (historical conversion)
   * @param {number} amount - Amount to convert
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Historical conversion result
   */
  async convertAtDate(amount, from, to, date) {
    const response = await this.client.get(`/convert/${amount}/${from}/${to}/${date}`);
    
    return {
      data: response,
      status: 200,
      message: 'Historical conversion successful',
    };
  }

  /**
   * Get supported currencies list
   * @returns {Promise<Object>} List of supported currencies
   */
  async getSupportedCurrencies() {
    const response = await this.getCurrencies();

    return {
      data: response.data,
      currencies: Object.keys(response.data),
      details: response.data,
    };
  }

  /**
   * Get rates for specific currencies only
   * @param {string} base - Base currency (ignored for free tier, always USD)
   * @param {Array} symbols - Array of currency codes
   * @returns {Promise<Object>} Specific currency rates
   */
  async getSpecificRates(base = 'NGN', symbols = ['USD', 'GBP', 'EUR', 'CAD']) {
    // OpenExchangeRates free tier only supports USD as base currency
    const response = await this.client.get('/latest.json', {
      base: 'USD',
      symbols: symbols.join(','),
    });

    return {
      data: response,
      status: 200,
      message: 'Specific rates fetched successfully',
    };
  }
}

/**
 * Create a singleton instance of the exchange rate repository
 */
let exchangeRateRepositoryInstance = null;

export function getExchangeRateRepository() {
  if (!exchangeRateRepositoryInstance) {
    exchangeRateRepositoryInstance = new ExchangeRateRepository();
  }
  return exchangeRateRepositoryInstance;
}

/**
 * Create a new exchange rate repository instance (for testing or custom config)
 */
export function createExchangeRateRepository(client) {
  return new ExchangeRateRepository(client);
}

export default ExchangeRateRepository;