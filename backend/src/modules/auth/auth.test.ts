import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import { UserRole } from '@prisma/client';
import { passwordSchema } from './auth.types';
import { authorizeCustomerOwnership } from '../../middlewares/auth.middleware';
import { Request, Response } from 'express';

describe('Authentication Module & RBAC Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  // Test state
  const testCustomerEmail = `test.cust.${Date.now()}@brightloop.test`;
  const testStaffEmail = `test.staff.${Date.now()}@brightloop.test`;
  const validPassword = 'SecurePassword@2026';
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let staffToken: string;

  before(async () => {
    // Start test server on dynamic ephemeral port
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}/api/v1/auth`;
        resolve();
      });
    });

    // Obtain Admin token from seeded admin user
    const adminRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminData.data.token;
  });

  after(async () => {
    // Clean up created test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testCustomerEmail, testStaffEmail],
        },
      },
    });

    // Close server
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // --------------------------------------------------------------------------
  // 1. Password Policy Enforcement Tests
  // --------------------------------------------------------------------------
  describe('1. Password Policy Enforcement (>=9 chars, 1 uppercase, 1 lowercase, 1 special)', () => {
    it('should reject passwords with less than 9 characters', () => {
      const result = passwordSchema.safeParse('Aa!1234'); // 7 chars
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.message.includes('9 characters')));
      }
    });

    it('should reject passwords without uppercase letters', () => {
      const result = passwordSchema.safeParse('lowercase@1234');
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.message.includes('uppercase')));
      }
    });

    it('should reject passwords without lowercase letters', () => {
      const result = passwordSchema.safeParse('UPPERCASE@1234');
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.message.includes('lowercase')));
      }
    });

    it('should reject passwords without special characters', () => {
      const result = passwordSchema.safeParse('PlainPassword1234');
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.message.includes('special character')));
      }
    });

    it('should accept valid passwords meeting all criteria', () => {
      const result = passwordSchema.safeParse('Brightloop@2026');
      assert.strictEqual(result.success, true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Customer Registration & Role Tampering Protection
  // --------------------------------------------------------------------------
  describe('2. Customer Registration & Role Tampering Protection', () => {
    it('should register a customer with valid credentials and return JWT token', async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testCustomerEmail,
          password: validPassword,
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Acme Test Corp',
          role: 'ADMIN', // Client maliciously supplying ADMIN role
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.email, testCustomerEmail.toLowerCase());
      // Crucial: Client-supplied role MUST be ignored; user role must strictly be CUSTOMER
      assert.strictEqual(body.data.user.role, UserRole.CUSTOMER);

      customerToken = body.data.token;
      customerId = body.data.user.id;
    });

    it('should prevent registration with duplicate email address (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testCustomerEmail, // Duplicate
          password: validPassword,
          firstName: 'Another',
          lastName: 'User',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 409);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('already exists'));
    });

    it('should reject registration if password does not meet policy (422 Unprocessable)', async () => {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `invalid.pwd.${Date.now()}@brightloop.test`,
          password: 'short',
          firstName: 'Bad',
          lastName: 'Password',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 422);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Validation error'));
    });
  });

  // --------------------------------------------------------------------------
  // 3. User Login & Invalid Credentials
  // --------------------------------------------------------------------------
  describe('3. Login & JWT Authentication', () => {
    it('should successfully login customer and return valid JWT', async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testCustomerEmail,
          password: validPassword,
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, UserRole.CUSTOMER);
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testCustomerEmail,
          password: 'WrongPassword@123',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Invalid email or password'));
    });

    it('should reject login for non-existent email (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent.user@brightloop.test',
          password: validPassword,
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(body.success, false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Role-Based Access Control (RBAC) & Admin Staff Creation
  // --------------------------------------------------------------------------
  describe('4. Role-Based Access Control & Admin Staff Creation', () => {
    it('should retrieve current user profile with valid token', async () => {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.data.email, testCustomerEmail.toLowerCase());
      assert.strictEqual(body.data.role, UserRole.CUSTOMER);
    });

    it('should reject /me request without Authorization token (401)', async () => {
      const res = await fetch(`${baseUrl}/me`);
      assert.strictEqual(res.status, 401);
    });

    it('should ALLOW authenticated ADMIN to create a STAFF account', async () => {
      const res = await fetch(`${baseUrl}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email: testStaffEmail,
          password: validPassword,
          firstName: 'Emma',
          lastName: 'Watson',
          phone: '+1-555-0999',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.role, UserRole.STAFF);

      // Verify created staff can log in
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStaffEmail,
          password: validPassword,
        }),
      });
      const loginBody = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      staffToken = loginBody.data.token;
    });

    it('should FORBID a CUSTOMER from creating a STAFF account (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`, // Customer token
        },
        body: JSON.stringify({
          email: `unauthorized.staff.${Date.now()}@brightloop.test`,
          password: validPassword,
          firstName: 'Hacker',
          lastName: 'Attempt',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Forbidden'));
    });

    it('should FORBID a STAFF member from creating another STAFF account (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`, // Staff token
        },
        body: JSON.stringify({
          email: `staff.trying.staff.${Date.now()}@brightloop.test`,
          password: validPassword,
          firstName: 'Another',
          lastName: 'Staff',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Forbidden'));
    });
  });

  // --------------------------------------------------------------------------
  // 5. Customer Resource Ownership Isolation (Requirement 11)
  // --------------------------------------------------------------------------
  describe('5. Customer Resource Ownership Isolation', () => {
    it('should block a customer from accessing another customer resource', async () => {
      const middleware = authorizeCustomerOwnership(() => 'other-customer-id-12345');

      const mockReq = {
        user: { id: customerId, role: UserRole.CUSTOMER },
      } as unknown as Request;

      let respondedStatus = 0;
      let respondedBody: any = null;
      const mockRes = {
        status: (code: number) => {
          respondedStatus = code;
          return {
            json: (payload: any) => {
              respondedBody = payload;
            },
          };
        },
      } as unknown as Response;

      let nextCalled = false;
      const mockNext = () => {
        nextCalled = true;
      };

      await middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(respondedStatus, 403);
      assert.ok(respondedBody.message.includes('You can only access your own'));
    });

    it('should allow customer to access their own resource', async () => {
      const middleware = authorizeCustomerOwnership(() => customerId);

      const mockReq = {
        user: { id: customerId, role: UserRole.CUSTOMER },
      } as unknown as Request;

      const mockRes = {} as unknown as Response;
      let nextCalled = false;
      const mockNext = () => {
        nextCalled = true;
      };

      await middleware(mockReq, mockRes, mockNext);
      assert.strictEqual(nextCalled, true);
    });

    it('should allow Staff and Admins to access customer resources', async () => {
      const middleware = authorizeCustomerOwnership(() => 'any-customer-id');

      // Admin access
      let adminNext = false;
      await middleware({ user: { id: 'admin-id', role: UserRole.ADMIN } } as any, {} as any, () => {
        adminNext = true;
      });
      assert.strictEqual(adminNext, true);

      // Staff access
      let staffNext = false;
      await middleware({ user: { id: 'staff-id', role: UserRole.STAFF } } as any, {} as any, () => {
        staffNext = true;
      });
      assert.strictEqual(staffNext, true);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Password Reset Flow (Single-use, Expiring, Non-enumerating)
  // --------------------------------------------------------------------------
  describe('6. Password Reset (Single-Use, Expiring, Non-Enumerating)', () => {
    let resetToken: string;

    it('should return identical success message for non-existent email (enumeration protection)', async () => {
      const res = await fetch(`${baseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent.random@brightloop.test' }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.ok(body.message.includes('If your email address is registered'));
      assert.strictEqual(body.data.resetToken, undefined);
    });

    it('should generate secure reset token for registered user', async () => {
      const res = await fetch(`${baseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testCustomerEmail }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.ok(body.data.resetToken);
      resetToken = body.data.resetToken;
    });

    it('should successfully reset password with valid token', async () => {
      const newPassword = 'NewSecretPassword@2026';
      const res = await fetch(`${baseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);

      // Verify that user can now log in with the new password
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testCustomerEmail,
          password: newPassword,
        }),
      });
      assert.strictEqual(loginRes.status, 200);
    });

    it('should reject reused reset token (single-use enforcement)', async () => {
      const res = await fetch(`${baseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken, // Already used token
          newPassword: 'AnotherPassword@2026',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Invalid or expired'));
    });
  });

  // --------------------------------------------------------------------------
  // 7. Logout & Session Invalidation
  // --------------------------------------------------------------------------
  describe('7. Logout and Session Invalidation', () => {
    it('should invalidate token on logout so subsequent requests are rejected (401)', async () => {
      // 1. Verify token works currently
      const meBefore = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(meBefore.status, 200);

      // 2. Call logout
      const logoutRes = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const logoutBody = await logoutRes.json();
      assert.strictEqual(logoutRes.status, 200);
      assert.strictEqual(logoutBody.success, true);

      // 3. Subsequent request with the same token MUST be rejected
      const meAfter = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const meAfterBody = await meAfter.json();
      assert.strictEqual(meAfter.status, 401);
      assert.ok(meAfterBody.message.includes('invalidated'));
    });
  });
});
