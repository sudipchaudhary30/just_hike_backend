import { Request, Response } from 'express';
import bcrypt from 'bcryptjs'; // USE bcryptjs NOT bcrypt
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Check if user exists (reference does this)
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // 2. Hash password (reference uses bcryptjs.hash)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Create user
    const user = await UserModel.create({ name, email, password: hashedPassword });
    
    // 4. Generate JWT token (reference uses jwt.sign)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    // 5. Return response (MATCH REFERENCE FORMAT)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token, // Include token
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Add similar login function following reference pattern
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // 2. Compare password (reference uses bcryptjs.compare)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // 3. Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    // 4. Return response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};