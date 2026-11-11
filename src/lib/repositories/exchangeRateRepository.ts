/**
 * OpenExchangeRates Repository
 * Handles all exchange rate API calls to OpenExchangeRates
 */

import { getOpenExchangeRatesClient, OpenExchangeRatesClient } from '../openExchangeRatesClient';

export interface ExchangeRateFilters {
  base?: string;
  symbols?: string;
  show_alternative?: boolean;
}

export interface RepositoryResponse<T> {
  data: T;
  status?: number;
  message?: string;
}

class ExchangeRateRepository {
  private client: OpenExchangeRatesClient;

  constructor(client: OpenExchangeRatesClient | null = null) {
    this.client = client || getOpenExchangeRatesClient();
  }

  /**
   * Get latest exchange rates with base currency
   * @param base - Base currency (default: USD for free tier compatibility)
   * @returns Exchange rates
   */
  async getLatestRates(base: string = 'USD'): Promise<RepositoryResponse<any>> {
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
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Target currency
   * @returns Conversion result
   */
  async convertCurrency(amount: number, from: string, to: string): Promise<RepositoryResponse<any>> {
    const response = await this.client.get(`/convert/${amount}/${from}/${to}`);

    return {
      data: response,
      status: 200,
      message: 'Conversion successful',
    };
  }

  /**
   * Get historical exchange rates for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @param base - Base currency (ignored for free tier, always USD)
   * @returns Historical rates
   */
  async getHistoricalRates(date: string, base: string = 'NGN'): Promise<RepositoryResponse<any>> {
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
   * @param start_date - Start date in YYYY-MM-DD
   * @param end_date - End date in YYYY-MM-DD
   * @param base - Base currency (ignored for free tier, always USD)
   * @param symbols - Comma-separated list of symbols
   * @returns Time-series data
   */
  async getTimeSeries(
    start_date: string,
    end_date: string,
    base: string = 'NGN',
    symbols: string = 'USD,GBP,EUR,CAD'
  ): Promise<RepositoryResponse<any>> {
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
   * @returns Available currencies
   */
  async getCurrencies(): Promise<RepositoryResponse<Record<string, string>>> {
    const response = await this.client.get('/currencies.json');

    return {
      data: response,
      status: 200,
      message: 'Currencies fetched successfully',
    };
  }

  /**
   * Get usage statistics for your API key
   * @returns Usage statistics
   */
  async getUsage(): Promise<RepositoryResponse<any>> {
    const response = await this.client.get('/usage.json');

    return {
      data: response,
      status: 200,
      message: 'Usage statistics fetched successfully',
    };
  }

  /**
   * Get latest rates with filtering
   * @param filters - Filter options
   * @param filters.base - Base currency (ignored for free tier, always USD)
   * @param filters.symbols - Comma-separated list of currencies
   * @param filters.show_alternative - Show alternative currencies
   * @returns Filtered rates
   */
  async getFilteredRates(filters: ExchangeRateFilters = {}): Promise<RepositoryResponse<any>> {
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
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Target currency
   * @param date - Date in YYYY-MM-DD format
   * @returns Historical conversion result
   */
  async convertAtDate(amount: number, from: string, to: string, date: string): Promise<RepositoryResponse<any>> {
    const response = await this.client.get(`/convert/${amount}/${from}/${to}/${date}`);

    return {
      data: response,
      status: 200,
      message: 'Historical conversion successful',
    };
  }

  /**
   * Get supported currencies list
   * @returns List of supported currencies
   */
  async getSupportedCurrencies(): Promise<{ data: Record<string, string>; currencies: string[]; details: Record<string, string> }> {
    const response = await this.getCurrencies();

    return {
      data: response.data,
      currencies: Object.keys(response.data),
      details: response.data,
    };
  }

  /**
   * Get rates for specific currencies only
   * @param base - Base currency (ignored for free tier, always USD)
   * @param symbols - Array of currency codes
   * @returns Specific currency rates
   */
  async getSpecificRates(base: string = 'NGN', symbols: string[] = ['USD', 'GBP', 'EUR', 'CAD']): Promise<RepositoryResponse<any>> {
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
let exchangeRateRepositoryInstance: ExchangeRateRepository | null = null;

export function getExchangeRateRepository(): ExchangeRateRepository {
  if (!exchangeRateRepositoryInstance) {
    exchangeRateRepositoryInstance = new ExchangeRateRepository();
  }
  return exchangeRateRepositoryInstance;
}

/**
 * Create a new exchange rate repository instance (for testing or custom config)
 */
export function createExchangeRateRepository(client: OpenExchangeRatesClient): ExchangeRateRepository {
  return new ExchangeRateRepository(client);
}

export default ExchangeRateRepository;
