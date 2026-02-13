import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';

describe('Password Reset Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const testUser = {
    name: 'Reset Test User',
    email: `reset-test-${uniqueSuffix}@example.com`,
    password: 'OldPass@1234',
  };

  let userId = '';
  let resetToken = '';
  let storedHashedToken = '';

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const user = await UserModel.findOne({ email: testUser.email });
    userId = user?._id.toString() || '';
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  test('POST /api/auth/forgot-password should generate and store reset token', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    // Retrieve the user from DB to get the stored hashed token
    const user = await UserModel.findOne({ email: testUser.email });
    expect(user).not.toBeNull();
    expect(user?.resetPasswordToken).toBeDefined();
    expect(user?.resetPasswordExpires).toBeDefined();

    storedHashedToken = user?.resetPasswordToken || '';
  });

  test('POST /api/auth/reset-password should reset password with valid token', async () => {
    // Manually generate the reset token from the stored hash
    // We need to find a way to get the original token
    // Since we can't intercept the email, we'll create a test token manually
    const testResetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(testResetToken).digest('hex');

    // Update the user with this known token
    await UserModel.findByIdAndUpdate(userId, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour from now
    });

    const newPassword = 'NewPass@5678';
    const response = await request(app)
      .post(`/api/auth/reset-password/${testResetToken}`)
      .send({ newPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Password has been reset successfully');

    // Verify the token was cleared
    const user = await UserModel.findById(userId);
    expect(user?.resetPasswordToken).toBeFalsy();
    expect(user?.resetPasswordExpires).toBeFalsy();
  });

  test('POST /api/auth/login should work with new password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'NewPass@5678',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token');
  });

  test('POST /api/auth/reset-password should reject expired token', async () => {
    // Create an expired token
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(expiredToken).digest('hex');

    // Update user with expired token
    await UserModel.findByIdAndUpdate(userId, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() - 1000), // 1 second ago (expired)
    });

    const response = await request(app)
      .post(`/api/auth/reset-password/${expiredToken}`)
      .send({ newPassword: 'AnotherPass@1234' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid or expired reset token');
  });

  test('POST /api/auth/reset-password should reject invalid token', async () => {
    const invalidToken = 'invalid-token-xyz';

    const response = await request(app)
      .post(`/api/auth/reset-password/${invalidToken}`)
      .send({ newPassword: 'AnotherPass@1234' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid or expired reset token');
  });
});
