/**
 * Exchange Rate Service
 * Business logic layer for exchange rate operations
 */

import { getExchangeRateRepository } from '../repositories/exchangeRateRepository.js';
import { ExchangeRateAdapter } from '../adapters/exchangeRateAdapter.js';

class ExchangeRateService {
  constructor(repository = null) {
    this.repository = repository || getExchangeRateRepository();
  }

  /**
   * Fetch latest exchange rates with NGN as base currency
   * @param {string} base - Base currency (default: NGN)
   * @param {Array} symbols - Specific currencies to fetch
   * @returns {Promise<Object>} Exchange rates with metadata
   */
  async fetchLatestRates(base = 'NGN', symbols = null) {
    try {
      let response;

      if (symbols) {
        response = await this.repository.getSpecificRates(base, symbols);
      } else {
        response = await this.repository.getLatestRates(base);
      }

      const adaptedData = ExchangeRateAdapter.fromOpenExchangeRates(response.data);

      // Filter to only supported currencies
      const supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
      const filteredRates = ExchangeRateAdapter.filterSupportedRates(
        adaptedData.rates,
        supportedCurrencies
      );

      // Ensure NGN is present in rates
      const normalizedRates = ExchangeRateAdapter.normalizeRatesWithNGN(filteredRates);

      // Convert USD-based rates to NGN-based rates (for free tier compatibility)
      // OpenExchangeRates free tier only returns USD-based rates
      const ngnBasedRates = ExchangeRateAdapter.convertUSDtoNGNBase(normalizedRates);

      return {
        rates: ngnBasedRates,
        base: 'NGN', // We convert to NGN base
        timestamp: adaptedData.timestamp,
        lastUpdated: adaptedData.lastUpdated,
        disclaimer: adaptedData.disclaimer,
        license: adaptedData.license,
        updateStatus: ExchangeRateAdapter.getUpdateStatus(adaptedData.timestamp),
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Convert amount between currencies
   * @param {number} amount - Amount to convert
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {Promise<Object>} Conversion result
   */
  async convertCurrency(amount, from, to) {
    try {
      const response = await this.repository.convertCurrency(amount, from, to);
      const adaptedData = ExchangeRateAdapter.fromConversionResponse(response.data);
      
      return {
        success: true,
        result: adaptedData.result,
        rate: adaptedData.rate,
        query: adaptedData.query,
        info: adaptedData.info,
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get supported currencies
   * @returns {Promise<Object>} Supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const response = await this.repository.getCurrencies();
      return {
        currencies: Object.keys(response.data),
        details: response.data,
      };
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      throw error;
    }
  }

  /**
   * Get historical exchange rates
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} base - Base currency (default: NGN)
   * @returns {Promise<Object>} Historical rates
   */
  async getHistoricalRates(date, base = 'NGN') {
    try {
      const response = await this.repository.getHistoricalRates(date, base);
      const adaptedData = ExchangeRateAdapter.fromHistoricalRates(response.data);

      // Filter to supported currencies
      const supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
      const filteredRates = ExchangeRateAdapter.filterSupportedRates(
        adaptedData.rates,
        supportedCurrencies
      );

      // Ensure NGN is present in rates
      const normalizedRates = ExchangeRateAdapter.normalizeRatesWithNGN(filteredRates);

      // Convert USD-based rates to NGN-based rates (for free tier compatibility)
      const ngnBasedRates = ExchangeRateAdapter.convertUSDtoNGNBase(normalizedRates);

      return {
        rates: ngnBasedRates,
        base: 'NGN', // We convert to NGN base
        date: adaptedData.date,
        timestamp: adaptedData.timestamp,
        lastUpdated: adaptedData.lastUpdated,
      };
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      throw error;
    }
  }

  /**
   * Get time-series data for currency tracking
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} base - Base currency (default: NGN)
   * @param {string} symbols - Comma-separated currencies
   * @returns {Promise<Object>} Time-series data
   */
  async getTimeSeries(startDate, endDate, base = 'NGN', symbols = 'USD,GBP,EUR,CAD') {
    try {
      const response = await this.repository.getTimeSeries(startDate, endDate, base, symbols);
      const adaptedData = ExchangeRateAdapter.fromTimeSeries(response.data);

      // Convert USD-based time-series data to NGN-based
      // Note: This is a simplified conversion - in production, you'd want to handle
      // each date's rates individually
      const ngnBasedTimeseries = {};
      if (adaptedData.timeseries) {
        Object.entries(adaptedData.timeseries).forEach(([date, rates]) => {
          const normalizedRates = ExchangeRateAdapter.normalizeRatesWithNGN(rates);
          ngnBasedTimeseries[date] = ExchangeRateAdapter.convertUSDtoNGNBase(normalizedRates);
        });
      }

      return {
        timeseries: ngnBasedTimeseries,
        current: adaptedData.current,
        base: 'NGN', // We convert to NGN base
        start_date: adaptedData.start_date,
        end_date: adaptedData.end_date,
        disclaimer: adaptedData.disclaimer,
        license: adaptedData.license,
      };
    } catch (error) {
      console.error('Error fetching time-series data:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsage() {
    try {
      const response = await this.repository.getUsage();
      return {
        data: response.data,
        status: response.status,
        message: response.message,
      };
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw error;
    }
  }

  /**
   * Check if rates need to be refreshed
   * @param {number} timestamp - Last update timestamp
   * @returns {boolean} Whether refresh is needed
   */
  needsRefresh(timestamp) {
    return ExchangeRateAdapter.isStale(timestamp);
  }

  /**
   * Calculate exchange rate between two currencies
   * @param {Object} rates - Exchange rates object
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {number} Exchange rate
   */
  calculateExchangeRate(rates, from, to) {
    return ExchangeRateAdapter.calculateExchangeRate(rates, from, to);
  }

  /**
   * Convert amount using provided rates
   * @param {number} amount - Amount to convert
   * @param {Object} rates - Exchange rates object
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {number} Converted amount
   */
  convertAmount(amount, rates, from, to) {
    return ExchangeRateAdapter.convertAmount(amount, rates, from, to);
  }

  /**
   * Format amount with currency symbol
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'NGN') {
    return ExchangeRateAdapter.formatCurrency(amount, currency);
  }

  /**
   * Get currency symbol
   * @param {string} currencyCode - Currency code
   * @returns {string} Currency symbol
   */
  getCurrencySymbol(currencyCode) {
    return ExchangeRateAdapter.getCurrencySymbol(currencyCode);
  }

  /**
   * Validate currency code
   * @param {string} currency - Currency code to validate
   * @returns {boolean} Whether currency is valid
   */
  isValidCurrency(currency) {
    return ExchangeRateAdapter.isValidCurrency(currency);
  }

  /**
   * Auto-refresh rates if they are stale
   * @param {Object} currentRates - Current rates object
   * @returns {Promise<Object>} Fresh rates if stale, current rates if not
   */
  async autoRefreshIfNeeded(currentRates) {
    if (this.needsRefresh(currentRates.timestamp)) {
      console.log('Rates are stale, refreshing...');
      return this.fetchLatestRates('NGN'); // Always request NGN as base
    }

    return currentRates;
  }
}

/**
 * Create a singleton instance of the exchange rate service
 */
let exchangeRateServiceInstance = null;

export function getExchangeRateService() {
  if (!exchangeRateServiceInstance) {
    exchangeRateServiceInstance = new ExchangeRateService();
  }
  return exchangeRateServiceInstance;
}

/**
 * Create a new exchange rate service instance (for testing or custom config)
 */
export function createExchangeRateService(repository) {
  return new ExchangeRateService(repository);
}

export default ExchangeRateService;