/**
 * Transaction Validator
 * Validates transaction data before sending to Paystack API
 */

import { z } from 'zod';

/**
 * Transaction initialization schema
 */
export const transactionInitSchema = z.object({
  email: z.string().email('Invalid email address'),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(1000000000, 'Amount cannot exceed ₦10,000,000'),
  currency: z.enum(['NGN', 'USD', 'GBP', 'EUR', 'CAD']).default('NGN'),
  reference: z.string().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  callbackUrl: z.string().url('Invalid callback URL').optional(),
  channels: z.array(z.enum(['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'])).optional(),
  metadata: z.object({
    bank: z.string().optional(),
    account: z.string().optional(),
    custom_description: z.string().optional(),
    sender_name: z.string().optional(),
    sender_account: z.string().optional(),
  }).optional(),
});

/**
 * Transaction verification schema
 */
export const transactionVerifySchema = z.object({
  reference: z.string().min(1, 'Transaction reference is required'),
});

/**
 * Transaction filters schema
 */
export const transactionFiltersSchema = z.object({
  perPage: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  customer: z.string().optional(),
  status: z.enum(['success', 'failed', 'pending', 'abandoned', 'queued']).optional(),
  amount: z.number().positive().optional(),
});

export interface TransactionInitData {
  email: string;
  amount: number;
  currency?: 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD';
  reference?: string;
  description?: string;
  callbackUrl?: string;
  channels?: ('card' | 'bank_transfer' | 'ussd' | 'qr' | 'mobile_money')[];
  metadata?: {
    bank?: string;
    account?: string;
    custom_description?: string;
    sender_name?: string;
    sender_account?: string;
  };
}

export interface TransactionVerifyData {
  reference: string;
}

export interface TransactionFiltersData {
  perPage?: number;
  page?: number;
  from?: string;
  to?: string;
  customer?: string;
  status?: 'success' | 'failed' | 'pending' | 'abandoned' | 'queued';
  amount?: number;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: z.ZodIssue[];
}

export interface FormattedError {
  field: string;
  message: string;
}

/**
 * Validate transaction initialization data
 */
export function validateTransactionInit(data: TransactionInitData): ValidationResult {
  try {
    return {
      success: true,
      data: transactionInitSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors,
      };
    }
    return {
      success: false,
      errors: [],
    };
  }
}

/**
 * Validate transaction verification request
 */
export function validateTransactionVerify(data: TransactionVerifyData): ValidationResult {
  try {
    return {
      success: true,
      data: transactionVerifySchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors,
      };
    }
    return {
      success: false,
      errors: [],
    };
  }
}

/**
 * Validate transaction filters
 */
export function validateTransactionFilters(data: TransactionFiltersData): ValidationResult {
  try {
    return {
      success: true,
      data: transactionFiltersSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors,
      };
    }
    return {
      success: false,
      errors: [],
    };
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: z.ZodIssue[]): FormattedError[] {
  return errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
