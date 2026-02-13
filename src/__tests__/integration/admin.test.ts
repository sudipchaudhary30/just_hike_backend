import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';

describe('Admin User Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminCredentials = {
    name: 'Admin User',
    email: `admin-users-${uniqueSuffix}@example.com`,
    password: 'Admin@1234',
  };
  const nonAdminCredentials = {
    name: 'Regular User',
    email: `user-users-${uniqueSuffix}@example.com`,
    password: 'User@1234',
  };

  let adminToken = '';
  let userToken = '';
  let adminId = '';
  let userId = '';
  let createdUserId = '';

  const createdUserPayload = {
    name: 'Managed User',
    email: `managed-${uniqueSuffix}@example.com`,
    password: 'User@5678',
    phoneNumber: '9811111111',
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);
    const admin = await UserModel.create({
      name: adminCredentials.name,
      email: adminCredentials.email,
      password: hashedPassword,
      role: 'admin',
    });
    adminId = admin._id.toString();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });
    adminToken = adminLogin.body.token;

    await request(app).post('/api/auth/register').send(nonAdminCredentials);
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: nonAdminCredentials.email, password: nonAdminCredentials.password });
    userToken = userLogin.body.token;

    const user = await UserModel.findOne({ email: nonAdminCredentials.email });
    userId = user?._id.toString() || '';
  });

  afterAll(async () => {
    if (createdUserId) {
      await UserModel.deleteMany({ _id: createdUserId });
    }
    if (userId) {
      await UserModel.deleteMany({ _id: userId });
    }
    if (adminId) {
      await UserModel.deleteMany({ _id: adminId });
    }
  });

  test('POST /api/admin/users should create user for admin', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createdUserPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created successfully');
    createdUserId = response.body.data?._id;
  });

  test('GET /api/admin/users should return paginated users', async () => {
    const response = await request(app)
      .get('/api/admin/users?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('limit', 5);
  });

  test('GET /api/admin/users/:id should return user by id', async () => {
    const response = await request(app)
      .get(`/api/admin/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data?._id).toBe(createdUserId);
  });

  test('PUT /api/admin/users/:id should update user for admin', async () => {
    const response = await request(app)
      .put(`/api/admin/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Managed User Updated' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User updated successfully');
    expect(response.body.data?.name).toBe('Managed User Updated');
  });

  test('DELETE /api/admin/users/:id should delete user for admin', async () => {
    const response = await request(app)
      .delete(`/api/admin/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'User deleted successfully');
  });

  test('GET /api/admin/users should reject non-admin user', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', 'Forbidden, admins only');
  });
});
