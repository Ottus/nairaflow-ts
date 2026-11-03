/**
 * Exchange Rate Adapter
 * Transforms OpenExchangeRates API responses to our application's data structure
 */

export class ExchangeRateAdapter {
  /**
   * Transform OpenExchangeRates latest rates response to our app's format
   */
  static fromOpenExchangeRates(response) {
    return {
      disclaimer: response.disclaimer,
      license: response.license,
      timestamp: response.timestamp,
      base: response.base,
      rates: response.rates,
      lastUpdated: new Date(response.timestamp * 1000).toISOString(),
    };
  }

  /**
   * Transform conversion response to our app's format
   */
  static fromConversionResponse(response) {
    return {
      success: true,
      query: response.query,
      info: response.info,
      historical: response.historical || false,
      date: response.date,
      rate: response.info?.rate,
      result: response.rates?.[Object.keys(response.rates)[0]],
    };
  }

  /**
   * Transform historical rates response
   */
  static fromHistoricalRates(response) {
    return {
      disclaimer: response.disclaimer,
      license: response.license,
      timestamp: response.timestamp,
      base: response.base,
      rates: response.rates,
      date: response.date,
      lastUpdated: new Date(response.timestamp * 1000).toISOString(),
    };
  }

  /**
   * Transform time-series response
   */
  static fromTimeSeries(response) {
    return {
      disclaimer: response.disclaimer,
      license: response.license,
      start_date: response.start_date,
      end_date: response.end_date,
      base: response.base,
      timeseries: response.rates,
      current: response.current,
    };
  }

  /**
   * Extract supported currencies from OpenExchangeRates response
   */
  static extractCurrencies(response) {
    return Object.keys(response);
  }

  /**
   * Filter rates to include only our supported currencies
   */
  static filterSupportedRates(rates, supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'CAD']) {
    const filteredRates = {};
    
    Object.entries(rates).forEach(([currency, rate]) => {
      if (supportedCurrencies.includes(currency)) {
        filteredRates[currency] = rate;
      }
    });
    
    return filteredRates;
  }

  /**
   * Add NGN to rates if not present (OpenExchangeRates may not have NGN)
   */
  static ensureNGNBase(rates) {
    if (!rates.NGN) {
      // If NGN is not in rates, we need to calculate it
      // This is a simplified approach - in production, you'd want to handle this differently
      console.warn('NGN not found in rates, may need to invert from USD rate');
    }
    return rates;
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
  }

  /**
   * Calculate exchange rate between two currencies
   * @param {Object} rates - Exchange rates object
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {number} Exchange rate
   */
  static calculateExchangeRate(rates, from, to) {
    const fromRate = rates[from];
    const toRate = rates[to];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not available for ${from} or ${to}`);
    }
    
    // Calculate cross rate: toRate / fromRate
    return toRate / fromRate;
  }

  /**
   * Convert amount using exchange rates
   * @param {number} amount - Amount to convert
   * @param {Object} rates - Exchange rates object
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {number} Converted amount
   */
  static convertAmount(amount, rates, from, to) {
    if (from === to) return amount;
    
    const exchangeRate = this.calculateExchangeRate(rates, from, to);
    return amount * exchangeRate;
  }

  /**
   * Invert exchange rate (for reverse conversion)
   * @param {number} rate - Exchange rate
   * @returns {number} Inverted rate
   */
  static invertRate(rate) {
    return 1 / rate;
  }

  /**
   * Round currency amount to 2 decimal places
   * @param {number} amount - Amount to round
   * @returns {number} Rounded amount
   */
  static roundAmount(amount) {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Check if rates are stale (older than 24 hours)
   * @param {number} timestamp - Unix timestamp
   * @returns {boolean} Whether rates are stale
   */
  static isStale(timestamp) {
    const now = Date.now();
    const rateDate = timestamp * 1000;
    const hoursSinceUpdate = (now - rateDate) / (1000 * 60 * 60);
    return hoursSinceUpdate > 24;
  }

  /**
   * Get rate update status
   * @param {number} timestamp - Unix timestamp
   * @returns {Object} Status information
   */
  static getUpdateStatus(timestamp) {
    const now = Date.now();
    const rateDate = timestamp * 1000;
    const hoursSinceUpdate = (now - rateDate) / (1000 * 60 * 60);
    
    return {
      isStale: hoursSinceUpdate > 24,
      hoursSinceUpdate: Math.floor(hoursSinceUpdate),
      lastUpdated: new Date(rateDate).toISOString(),
      nextUpdate: new Date(rateDate + (24 * 60 * 60 * 1000)).toISOString(),
    };
  }

  /**
   * Sort currencies alphabetically
   * @param {Array} currencies - Array of currency codes
   * @returns {Array} Sorted currencies
   */
  static sortCurrencies(currencies) {
    return [...currencies].sort();
  }

  /**
   * Get currency symbol
   * @param {string} currencyCode - Currency code
   * @returns {string} Currency symbol
   */
  static getCurrencySymbol(currencyCode) {
    const symbols = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
      EUR: '€',
      CAD: 'C$',
    };
    return symbols[currencyCode] || currencyCode;
  }

  /**
   * Format rate for display
   * @param {number} rate - Exchange rate
   * @param {string} from - Source currency
   * @param {string} to - Target currency
   * @returns {string} Formatted rate string
   */
  static formatRate(rate, from, to) {
    return `1 ${from} = ${this.roundAmount(rate)} ${to}`;
  }

  /**
   * Validate currency code
   * @param {string} currency - Currency code to validate
   * @returns {boolean} Whether currency is valid
   */
  static isValidCurrency(currency) {
    const validCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'JPY', 'CHF', 'AUD', 'CNY', 'INR'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Add NGN as base currency if not present in rates
   * This handles cases where OpenExchangeRates doesn't include NGN
   */
  static normalizeRatesWithNGN(rates) {
    if (rates.NGN) {
      return rates; // NGN already present
    }

    // If NGN is not present, we'll add it with a default rate
    // In production, you'd want to get this from a reliable source
    console.warn('NGN not found in rates, adding with estimated rate');
    return {
      ...rates,
      NGN: 1 / 0.000625, // Approximate rate (1 USD = 1600 NGN)
    };
  }

  /**
   * Convert USD-based rates to NGN-based rates
   * This is used for OpenExchangeRates free tier which only supports USD as base
   * @param {Object} rates - USD-based rates object
   * @returns {Object} NGN-based rates object
   */
  static convertUSDtoNGNBase(rates) {
    if (!rates.NGN) {
      console.warn('NGN rate not available, cannot convert to NGN base');
      return rates;
    }

    const ngnRate = rates.NGN; // Rate of 1 USD in NGN
    const ngnBasedRates = { NGN: 1 };

    // Convert all rates from USD base to NGN base
    Object.entries(rates).forEach(([currency, usdRate]) => {
      if (currency !== 'NGN') {
        // Formula: NGN_rate = USD_rate / NGN_rate
        // Example: If 1 USD = 1600 NGN and 1 USD = 0.8 GBP
        // Then 1 NGN = 0.8 / 1600 = 0.0005 GBP
        ngnBasedRates[currency] = usdRate / ngnRate;
      }
    });

    return ngnBasedRates;
  }
}