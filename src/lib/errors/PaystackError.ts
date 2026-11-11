/**
 * Custom error class for Paystack API errors
 * Provides structured error information for better error handling
 */

export interface ErrorResponse {
  data?: any;
  status?: number;
  message?: string;
}

export class PaystackError extends Error {
  public statusCode: number | null;
  public response: any;

  constructor(message: string, statusCode: number | null = null, response: any = null) {
    super(message);
    this.name = 'PaystackError';
    this.statusCode = statusCode;
    this.response = response;
  }

  static fromResponse(response: ErrorResponse): PaystackError {
    const errorData = response.data || {};
    return new PaystackError(
      errorData.message || 'Paystack API request failed',
      response.status,
      errorData
    );
  }

  isNetworkError(): boolean {
    return !this.statusCode;
  }

  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  isUnauthorizedError(): boolean {
    return this.statusCode === 401;
  }

  isPaymentError(): boolean {
    return this.statusCode === 402;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  isServerError(): boolean {
    return this.statusCode !== null && this.statusCode >= 500;
  }
}
