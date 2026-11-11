/**
 * Customer Validator
 * Validates customer data before sending to Paystack API
 */

import { z } from 'zod';

/**
 * Customer creation schema (Paystack: POST /customer)
 */
export const customerCreateSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
});

/**
 * Customer update schema (Paystack: PUT /customer/:customer_code)
 * Email is locked once created; everything else is optional
 */
export const customerUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
});

/**
 * Customer filters schema
 */
export const customerFiltersSchema = z.object({
  perPage: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  search: z.string().max(100).optional(),
});

export interface CustomerCreateData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CustomerUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CustomerFiltersData {
  perPage?: number;
  page?: number;
  search?: string;
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
 * Validate customer creation data
 */
export function validateCustomerCreate(data: CustomerCreateData): ValidationResult {
  try {
    return {
      success: true,
      data: customerCreateSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues,
      };
    }
    return {
      success: false,
      errors: [],
    };
  }
}

/**
 * Validate customer update data
 */
export function validateCustomerUpdate(data: CustomerUpdateData): ValidationResult {
  try {
    return {
      success: true,
      data: customerUpdateSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues,
      };
    }
    return {
      success: false,
      errors: [],
    };
  }
}

/**
 * Validate customer filters
 */
export function validateCustomerFilters(data: CustomerFiltersData): ValidationResult {
  try {
    return {
      success: true,
      data: customerFiltersSchema.parse(data),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues,
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
