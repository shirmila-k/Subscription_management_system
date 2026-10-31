import { z } from 'zod';
import { UserRole } from '@prisma/client';

/**
 * Password Policy:
 * - At least nine characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Public Customer Registration Schema
 * Never accepts or trusts client-supplied roles.
 */
export const RegisterCustomerSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  companyName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
});

/**
 * Admin-Only Staff Account Creation Schema
 */
export const CreateStaffSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
});

/**
 * User Login Schema
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address format')
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot Password Request Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Valid email address is required')
    .transform((val) => val.toLowerCase().trim()),
});

/**
 * Password Reset Schema
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').trim(),
  newPassword: passwordSchema,
});

// Alias for backwards compatibility
export const RegisterSchema = RegisterCustomerSchema;

export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>;
export type RegisterInput = RegisterCustomerInput;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
