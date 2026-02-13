import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';
import { TrekModel } from '../../models/trek.model';
import { BookingModel } from '../../models/booking.model';

describe('Booking Integration Tests', () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminCredentials = {
    name: 'Admin User',
    email: `admin-booking-${uniqueSuffix}@example.com`,
    password: 'Admin@1234',
  };
  const userCredentials = {
    name: 'Booking User',
    email: `user-booking-${uniqueSuffix}@example.com`,
    password: 'User@1234',
  };

  let adminToken = '';
  let userToken = '';
  let adminId = '';
  let userId = '';
  let trekId = '';
  let bookingId = '';

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

    await request(app).post('/api/auth/register').send(userCredentials);
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: userCredentials.email, password: userCredentials.password });
    userToken = userLogin.body.token;
    const user = await UserModel.findOne({ email: userCredentials.email });
    userId = user?._id.toString() || '';

    const trek = await TrekModel.create({
      title: 'Annapurna Circuit',
      description: 'Classic circuit trek.',
      difficulty: 'moderate',
      durationDays: 10,
      price: 1200,
      location: 'Nepal',
      maxGroupSize: 10,
      createdBy: admin._id,
    });
    trekId = trek._id.toString();
  });

  afterAll(async () => {
    if (bookingId) {
      await BookingModel.deleteMany({ _id: bookingId });
    }
    if (trekId) {
      await TrekModel.deleteMany({ _id: trekId });
    }
    if (userId) {
      await UserModel.deleteMany({ _id: userId });
    }
    if (adminId) {
      await UserModel.deleteMany({ _id: adminId });
    }
  });

  test('POST /api/bookings should reject unauthorized request', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({ trekId, startDate: new Date().toISOString(), participants: 2 });

    expect(response.status).toBe(401);
  });

  test('POST /api/bookings should validate missing fields', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ trekId });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'trekId, startDate, participants are required');
  });

  test('POST /api/bookings should reject invalid trek', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        trekId: new mongoose.Types.ObjectId().toString(),
        startDate: new Date().toISOString(),
        participants: 2,
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Trek not found');
  });

  test('POST /api/bookings should create booking for user', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        trekId,
        startDate: new Date().toISOString(),
        participants: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Booking created successfully');
    bookingId = response.body.data?._id;
  });

  test('GET /api/bookings should return current user bookings', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((booking: any) => booking._id === bookingId)).toBe(true);
  });

  test('PUT /api/bookings/:id should update pending booking', async () => {
    const response = await request(app)
      .put(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ participants: 3 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Booking updated successfully');
    expect(response.body.data?.totalPrice).toBe(3600);
  });

  test('DELETE /api/bookings/:id should cancel booking', async () => {
    const response = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Booking cancelled successfully');
    expect(response.body.data?.status).toBe('cancelled');
  });

  test('PUT /api/bookings/:id should reject update after cancellation', async () => {
    const response = await request(app)
      .put(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ participants: 1 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Only pending bookings can be updated');
  });
});
