/**
 * Exchange Rate Service
 * Business logic layer for exchange rate operations
 */

import { getExchangeRateRepository, ExchangeRateRepository } from '../repositories/exchangeRateRepository';
import { ExchangeRateAdapter } from '../adapters/exchangeRateAdapter';

export interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
  lastUpdated: string;
  disclaimer?: string;
  license?: string;
  updateStatus?: {
    isStale: boolean;
    hoursSinceUpdate: number;
    lastUpdated: string;
    nextUpdate: string;
  };
}

export interface ConversionResult {
  success: boolean;
  result: number;
  rate: number;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    rate: number;
    timestamp: number;
  };
}

export interface HistoricalRatesResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
  timestamp: number;
  lastUpdated: string;
}

export interface TimeSeriesResponse {
  timeseries: Record<string, Record<string, number>>;
  current?: Record<string, number>;
  base: string;
  start_date: string;
  end_date: string;
  disclaimer?: string;
  license?: string;
}

export interface CurrenciesResponse {
  currencies: string[];
  details: Record<string, string>;
}

class ExchangeRateService {
  private repository: ExchangeRateRepository;

  constructor(repository: ExchangeRateRepository | null = null) {
    this.repository = repository || getExchangeRateRepository();
  }

  /**
   * Fetch latest exchange rates with NGN as base currency
   * @param base - Base currency (default: NGN)
   * @param symbols - Specific currencies to fetch
   * @returns Exchange rates with metadata
   */
  async fetchLatestRates(base: string = 'NGN', symbols: string[] | null = null): Promise<ExchangeRateResponse> {
    try {
      let response: any;

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
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Target currency
   * @returns Conversion result
   */
  async convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult> {
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
   * @returns Supported currencies
   */
  async getSupportedCurrencies(): Promise<CurrenciesResponse> {
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
   * @param date - Date in YYYY-MM-DD format
   * @param base - Base currency (default: NGN)
   * @returns Historical rates
   */
  async getHistoricalRates(date: string, base: string = 'NGN'): Promise<HistoricalRatesResponse> {
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
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param base - Base currency (default: NGN)
   * @param symbols - Comma-separated currencies
   * @returns Time-series data
   */
  async getTimeSeries(
    startDate: string,
    endDate: string,
    base: string = 'NGN',
    symbols: string = 'USD,GBP,EUR,CAD'
  ): Promise<TimeSeriesResponse> {
    try {
      const response = await this.repository.getTimeSeries(startDate, endDate, base, symbols);
      const adaptedData = ExchangeRateAdapter.fromTimeSeries(response.data);

      // Convert USD-based time-series data to NGN-based
      // Note: This is a simplified conversion - in production, you'd want to handle
      // each date's rates individually
      const ngnBasedTimeseries: Record<string, Record<string, number>> = {};
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
   * @returns Usage statistics
   */
  async getUsage(): Promise<{ data: any; status?: number; message?: string }> {
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
   * @param timestamp - Last update timestamp
   * @returns Whether refresh is needed
   */
  needsRefresh(timestamp: number): boolean {
    return ExchangeRateAdapter.isStale(timestamp);
  }

  /**
   * Calculate exchange rate between two currencies
   * @param rates - Exchange rates object
   * @param from - Source currency
   * @param to - Target currency
   * @returns Exchange rate
   */
  calculateExchangeRate(rates: Record<string, number>, from: string, to: string): number {
    return ExchangeRateAdapter.calculateExchangeRate(rates, from, to);
  }

  /**
   * Convert amount using provided rates
   * @param amount - Amount to convert
   * @param rates - Exchange rates object
   * @param from - Source currency
   * @param to - Target currency
   * @returns Converted amount
   */
  convertAmount(amount: number, rates: Record<string, number>, from: string, to: string): number {
    return ExchangeRateAdapter.convertAmount(amount, rates, from, to);
  }

  /**
   * Format amount with currency symbol
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currency: string = 'NGN'): string {
    return ExchangeRateAdapter.formatCurrency(amount, currency);
  }

  /**
   * Get currency symbol
   * @param currencyCode - Currency code
   * @returns Currency symbol
   */
  getCurrencySymbol(currencyCode: string): string {
    return ExchangeRateAdapter.getCurrencySymbol(currencyCode);
  }

  /**
   * Validate currency code
   * @param currency - Currency code to validate
   * @returns Whether currency is valid
   */
  isValidCurrency(currency: string): boolean {
    return ExchangeRateAdapter.isValidCurrency(currency);
  }

  /**
   * Auto-refresh rates if they are stale
   * @param currentRates - Current rates object
   * @returns Fresh rates if stale, current rates if not
   */
  async autoRefreshIfNeeded(currentRates: ExchangeRateResponse): Promise<ExchangeRateResponse> {
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
let exchangeRateServiceInstance: ExchangeRateService | null = null;

export function getExchangeRateService(): ExchangeRateService {
  if (!exchangeRateServiceInstance) {
    exchangeRateServiceInstance = new ExchangeRateService();
  }
  return exchangeRateServiceInstance;
}

/**
 * Create a new exchange rate service instance (for testing or custom config)
 */
export function createExchangeRateService(repository: ExchangeRateRepository): ExchangeRateService {
  return new ExchangeRateService(repository);
}

export default ExchangeRateService;
