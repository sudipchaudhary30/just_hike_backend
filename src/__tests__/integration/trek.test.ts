import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';
import { TrekModel } from '../../models/trek.model';

describe('Trek Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminCredentials = {
    name: 'Admin User',
    email: `admin-trek-${uniqueSuffix}@example.com`,
    password: 'Admin@1234',
  };

  let adminToken = '';
  let adminId = '';
  let trekId = '';

  const trekPayload = {
    title: 'Everest Base Camp',
    description: 'A stunning trek to the base of Everest.',
    difficulty: 'hard',
    durationDays: 12,
    price: 1500,
    location: 'Nepal',
    maxGroupSize: 8,
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

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: adminCredentials.email, password: adminCredentials.password });
    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    if (trekId) {
      await TrekModel.deleteMany({ _id: trekId });
    }
    if (adminId) {
      await UserModel.deleteMany({ _id: adminId });
    }
  });

  test('GET /api/treks should return empty list initially', async () => {
    const response = await request(app).get('/api/treks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/treks should reject unauthorized request', async () => {
    const response = await request(app)
      .post('/api/treks')
      .send(trekPayload);

    expect(response.status).toBe(401);
  });

  test('POST /api/treks should create trek for admin', async () => {
    const response = await request(app)
      .post('/api/treks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(trekPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Trek created successfully');
    trekId = response.body.data?._id;
  });

  test('GET /api/treks/:id should return trek by id', async () => {
    const response = await request(app).get(`/api/treks/${trekId}`);

    expect(response.status).toBe(200);
    expect(response.body.data?._id).toBe(trekId);
  });

  test('PUT /api/treks/:id should update trek for admin', async () => {
    const response = await request(app)
      .put(`/api/treks/${trekId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 1800 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Trek updated successfully');
    expect(response.body.data?.price).toBe(1800);
  });

  test('DELETE /api/treks/:id should delete trek for admin', async () => {
    const response = await request(app)
      .delete(`/api/treks/${trekId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Trek deleted successfully');
  });

  test('GET /api/treks/:id should return 404 after delete', async () => {
    const response = await request(app).get(`/api/treks/${trekId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Trek not found');
  });
});
