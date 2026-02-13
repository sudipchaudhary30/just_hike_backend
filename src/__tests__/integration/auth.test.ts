import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';

describe('Authentication Integration Tests', () => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const testUser = {
        name: 'Test User',
        email: `test-${uniqueSuffix}@example.com`,
        password: 'Test@1234'
    };
    let authToken = '';

    beforeAll(async () => {
        await UserModel.deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: testUser.email });
    });

    describe('POST /api/auth/register', () => {
        test('should validate missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ name: testUser.name, email: testUser.email });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'All fields are required');
        });

        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Registration successful');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('data');
        });

        test('should fail to register a user with existing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            authToken = response.body.token;
        });

        test('should fail to login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'WrongPass123' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    describe('GET /api/auth/verify', () => {
        test('should verify a valid user token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Token is valid');
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /api/auth/verify-admin', () => {
        test('should reject non-admin user', async () => {
            const response = await request(app)
                .get('/api/auth/verify-admin')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Forbidden, admins only');
        });
    });

    describe('POST /api/auth/set-cookies', () => {
        test('should set auth cookie for valid token', async () => {
            const response = await request(app)
                .post('/api/auth/set-cookies')
                .send({ token: authToken });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Auth cookie set');
            expect(response.headers['set-cookie']).toBeDefined();
        });
    });
});