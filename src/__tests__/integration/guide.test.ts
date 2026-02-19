import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';
import { GuideModel } from '../../models/guide.model';

describe('Guide Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminCredentials = {
    name: 'Admin User',
    email: `admin-guide-${uniqueSuffix}@example.com`,
    password: 'Admin@1234',
  };

  let adminToken = '';
  let adminId = '';
  let guideId = '';

  const guidePayload = {
    name: 'Sita Gurung',
    email: 'sita@example.com',
    phoneNumber: '9800000000',
    bio: 'Experienced mountain guide.',
    experienceYears: 5,
    languages: ['English', 'Nepali'],
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
    if (guideId) {
      await GuideModel.deleteMany({ _id: guideId });
    }
    if (adminId) {
      await UserModel.deleteMany({ _id: adminId });
    }
  });

  test('POST /api/guides should reject unauthorized request', async () => {
    const response = await request(app)
      .post('/api/guides')
      .send(guidePayload);

    expect(response.status).toBe(401);
  });

  test('POST /api/guides should validate missing name', async () => {
    const response = await request(app)
      .post('/api/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: guidePayload.email });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Name is required');
  });

  test('POST /api/guides should create guide for admin', async () => {
    const response = await request(app)
      .post('/api/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(guidePayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Guide created successfully');
    guideId = response.body.data?._id;
  });

  test('GET /api/guides should return guides list', async () => {
    const response = await request(app).get('/api/guides');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((guide: any) => guide._id === guideId)).toBe(true);
  });

  test('GET /api/admin/guides should reject unauthorized request', async () => {
    const response = await request(app).get('/api/admin/guides');

    expect(response.status).toBe(401);
  });

  test('GET /api/admin/guides should return guides list for admin', async () => {
    const response = await request(app)
      .get('/api/admin/guides')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((guide: any) => guide._id === guideId)).toBe(true);
  });

  test('GET /api/guides/:id should return guide by id', async () => {
    const response = await request(app).get(`/api/guides/${guideId}`);

    expect(response.status).toBe(200);
    expect(response.body.data?._id).toBe(guideId);
  });

  test('PUT /api/guides/:id should update guide for admin', async () => {
    const response = await request(app)
      .put(`/api/guides/${guideId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bio: 'Updated bio', experienceYears: 6 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Guide updated successfully');
    expect(response.body.data?.bio).toBe('Updated bio');
  });

  test('DELETE /api/guides/:id should delete guide for admin', async () => {
    const response = await request(app)
      .delete(`/api/guides/${guideId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Guide deleted successfully');
  });

  test('GET /api/guides/:id should return 404 after delete', async () => {
    const response = await request(app).get(`/api/guides/${guideId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Guide not found');
  });
});
