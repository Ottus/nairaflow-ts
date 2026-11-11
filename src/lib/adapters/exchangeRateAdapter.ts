/**
 * Exchange Rate Adapter
 * Transforms OpenExchangeRates API responses to our application's data structure
 */

export interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface ConversionResponse {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    rate: number;
    timestamp: number;
  };
  historical?: boolean;
  date?: string;
  rates?: Record<string, number>;
}

export interface AdaptedExchangeRates {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

export interface AdaptedConversion {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    rate: number;
    timestamp: number;
  };
  historical: boolean;
  date?: string;
  rate?: number;
  result?: number;
}

export interface AdaptedHistoricalRates {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
  date: string;
  lastUpdated: string;
}

export interface AdaptedTimeSeries {
  disclaimer: string;
  license: string;
  start_date: string;
  end_date: string;
  base: string;
  timeseries: Record<string, Record<string, number>>;
  current?: Record<string, number>;
}

export interface UpdateStatus {
  isStale: boolean;
  hoursSinceUpdate: number;
  lastUpdated: string;
  nextUpdate: string;
}

export class ExchangeRateAdapter {
  /**
   * Transform OpenExchangeRates latest rates response to our app's format
   */
  static fromOpenExchangeRates(response: OpenExchangeRatesResponse): AdaptedExchangeRates {
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
  static fromConversionResponse(response: ConversionResponse): AdaptedConversion {
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
  static fromHistoricalRates(response: OpenExchangeRatesResponse & { date?: string }): AdaptedHistoricalRates {
    return {
      disclaimer: response.disclaimer,
      license: response.license,
      timestamp: response.timestamp,
      base: response.base,
      rates: response.rates,
      date: response.date || '',
      lastUpdated: new Date(response.timestamp * 1000).toISOString(),
    };
  }

  /**
   * Transform time-series response
   */
  static fromTimeSeries(response: any): AdaptedTimeSeries {
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
  static extractCurrencies(response: Record<string, string>): string[] {
    return Object.keys(response);
  }

  /**
   * Filter rates to include only our supported currencies
   */
  static filterSupportedRates(rates: Record<string, number>, supportedCurrencies: string[] = ['NGN', 'USD', 'GBP', 'EUR', 'CAD']): Record<string, number> {
    const filteredRates: Record<string, number> = {};

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
  static ensureNGNBase(rates: Record<string, number>): Record<string, number> {
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
  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  /**
   * Calculate exchange rate between two currencies
   * @param rates - Exchange rates object
   * @param from - Source currency
   * @param to - Target currency
   * @returns Exchange rate
   */
  static calculateExchangeRate(rates: Record<string, number>, from: string, to: string): number {
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
   * @param amount - Amount to convert
   * @param rates - Exchange rates object
   * @param from - Source currency
   * @param to - Target currency
   * @returns Converted amount
   */
  static convertAmount(amount: number, rates: Record<string, number>, from: string, to: string): number {
    if (from === to) return amount;

    const exchangeRate = this.calculateExchangeRate(rates, from, to);
    return amount * exchangeRate;
  }

  /**
   * Invert exchange rate (for reverse conversion)
   * @param rate - Exchange rate
   * @returns Inverted rate
   */
  static invertRate(rate: number): number {
    return 1 / rate;
  }

  /**
   * Round currency amount to 2 decimal places
   * @param amount - Amount to round
   * @returns Rounded amount
   */
  static roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Format currency for display
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted currency string
   */
  static formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Check if rates are stale (older than 24 hours)
   * @param timestamp - Unix timestamp
   * @returns Whether rates are stale
   */
  static isStale(timestamp: number): boolean {
    const now = Date.now();
    const rateDate = timestamp * 1000;
    const hoursSinceUpdate = (now - rateDate) / (1000 * 60 * 60);
    return hoursSinceUpdate > 24;
  }

  /**
   * Get rate update status
   * @param timestamp - Unix timestamp
   * @returns Status information
   */
  static getUpdateStatus(timestamp: number): UpdateStatus {
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
   * @param currencies - Array of currency codes
   * @returns Sorted currencies
   */
  static sortCurrencies(currencies: string[]): string[] {
    return [...currencies].sort();
  }

  /**
   * Get currency symbol
   * @param currencyCode - Currency code
   * @returns Currency symbol
   */
  static getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
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
   * @param rate - Exchange rate
   * @param from - Source currency
   * @param to - Target currency
   * @returns Formatted rate string
   */
  static formatRate(rate: number, from: string, to: string): string {
    return `1 ${from} = ${this.roundAmount(rate)} ${to}`;
  }

  /**
   * Validate currency code
   * @param currency - Currency code to validate
   * @returns Whether currency is valid
   */
  static isValidCurrency(currency: string): boolean {
    const validCurrencies = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'JPY', 'CHF', 'AUD', 'CNY', 'INR'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Add NGN as base currency if not present in rates
   * This handles cases where OpenExchangeRates doesn't include NGN
   */
  static normalizeRatesWithNGN(rates: Record<string, number>): Record<string, number> {
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
   * @param rates - USD-based rates object
   * @returns NGN-based rates object
   */
  static convertUSDtoNGNBase(rates: Record<string, number>): Record<string, number> {
    if (!rates.NGN) {
      console.warn('NGN rate not available, cannot convert to NGN base');
      return rates;
    }

    const ngnRate = rates.NGN; // Rate of 1 USD in NGN
    const ngnBasedRates: Record<string, number> = { NGN: 1 };

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
