import { beforeAll, afterAll, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    jest.setTimeout(60000);
    
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB for testing');
});

afterAll(async () => {
    // Cleanup
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});