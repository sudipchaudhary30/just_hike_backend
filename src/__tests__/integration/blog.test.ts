import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';
import { BlogModel } from '../../models/blog.model';

describe('Blog Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminCredentials = {
    name: 'Admin User',
    email: `admin-blog-${uniqueSuffix}@example.com`,
    password: 'Admin@1234',
  };

  let adminToken = '';
  let adminId = '';
  let blogId = '';

  const blogPayload = {
    title: 'Top Treks in Nepal',
    content: 'A guide to the best treks in Nepal.',
    tags: ['trek', 'nepal'],
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
    if (blogId) {
      await BlogModel.deleteMany({ _id: blogId });
    }
    if (adminId) {
      await UserModel.deleteMany({ _id: adminId });
    }
  });

  test('GET /api/blogs should return empty published list initially', async () => {
    const response = await request(app).get('/api/blogs');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/blogs should reject unauthorized request', async () => {
    const response = await request(app)
      .post('/api/blogs')
      .send(blogPayload);

    expect(response.status).toBe(401);
  });

  test('POST /api/blogs should create draft blog for admin', async () => {
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(blogPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Blog created successfully');
    blogId = response.body.data?._id;
  });

  test('GET /api/blogs/:id should reject draft blog', async () => {
    const response = await request(app).get(`/api/blogs/${blogId}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Blog not found');
  });

  test('PUT /api/blogs/:id should publish blog for admin', async () => {
    const response = await request(app)
      .put(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published', excerpt: 'Best treks overview.' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Blog updated successfully');
  });

  test('GET /api/blogs/:id should return published blog', async () => {
    const response = await request(app).get(`/api/blogs/${blogId}`);

    expect(response.status).toBe(200);
    expect(response.body.data?._id).toBe(blogId);
  });

  test('GET /api/blogs should include published blog', async () => {
    const response = await request(app).get('/api/blogs');

    expect(response.status).toBe(200);
    expect(response.body.data.some((blog: any) => blog._id === blogId)).toBe(true);
  });

  test('DELETE /api/blogs/:id should delete blog for admin', async () => {
    const response = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Blog deleted successfully');
  });
});
