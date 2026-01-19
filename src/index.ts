import express from 'express';
import cors from 'cors'; // ADD THIS
import dotenv from 'dotenv';
import { connectDatabase } from './database/mongodb';
import authRoutes from './routes/auth.route';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;

// CORS Configuration (FROM REFERENCE)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  credentials: true
}));

app.use(express.json());
connectDatabase();

// Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running with CORS on port ${PORT}`);
});