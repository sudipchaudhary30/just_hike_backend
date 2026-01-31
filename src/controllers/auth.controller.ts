import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { JWT_SECRET } from '../config';

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;
  const tokenFromCookie = (req as any).cookies?.token || (req as any).cookies?.accessToken;
  const tokenFromBody = (req.body as any)?.token;

  return tokenFromHeader || tokenFromCookie || tokenFromBody;
};

// Helper to build image URL
const getImageUrl = (filename: string | undefined, req: Request): string | null => {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// CREATE USER WITH IMAGE (PUBLIC)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const createData: any = {
      name,
      email,
      password: hashedPassword,
    };
    
    if (phoneNumber) createData.phoneNumber = phoneNumber;
    if (req.file) createData.profilePicture = req.file.filename;
    
    const user = await UserModel.create(createData);
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: getImageUrl(user.profilePicture, req),
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user'
    });
  }
};

// REGISTER FUNCTION
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with your schema fields
    const user = await UserModel.create({ 
      name, 
      email, 
      password: hashedPassword,
      // phoneNumber will use default: "9846676138"
      // role will use default: 'user'
      // profilePicture will use default: "default-profile.png"
      // timestamps will be added automatically
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return response with all user fields (password excluded automatically)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: userResponse
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// LOGIN FUNCTION
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user and explicitly select password
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Prepare user response without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    // Return response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: userResponse
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// UPDATE PROFILE FUNCTION
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // req.user is set by authorizedMiddleware
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get update fields from request body
    const { name, phoneNumber } = req.body;
    
    // Prepare update object
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    
    // If file was uploaded, add it to update data
    if (req.file) {
      updateData.profilePicture = req.file.filename;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return updated user
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed'
    });
  }
};

// UPDATE USER BY ID (AUTH)
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
    const targetUserId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const isAdmin = (req.user as any)?.role === 'admin';
    if (!isAdmin && userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const { name, email, password, phoneNumber } = req.body;

    

    if (email && email !== existingUser.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePicture = req.file.filename;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: getImageUrl(updatedUser?.profilePicture, req),
        role: updatedUser?.role,
        phoneNumber: updatedUser?.phoneNumber
      }
    });
  } catch (error: any) {
    console.error('Update user by id error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'User update failed'
    });
  }
};

// VERIFY TOKEN (AUTH)
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const token = getTokenFromRequest(req);
    const decoded = token ? (jwt.verify(token, JWT_SECRET) as Record<string, any>) : undefined;

    return res.json({
      success: true,
      message: 'Token is valid',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        iat: decoded?.iat,
        exp: decoded?.exp
      }
    });
  } catch (error: any) {
    console.error('Verify token error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Token verification failed'
    });
  }
};

// SET AUTH COOKIE (AUTH)
export const setAuthCookie = async (req: Request, res: Response) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // verify token before setting cookie
    jwt.verify(token, JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({
      success: true,
      message: 'Auth cookie set'
    });
  } catch (error: any) {
    console.error('Set auth cookie error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

// VERIFY ADMIN TOKEN (AUTH)
export const verifyAdminToken = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden, admins only'
      });
    }

    const token = getTokenFromRequest(req);
    const decoded = token ? (jwt.verify(token, JWT_SECRET) as Record<string, any>) : undefined;

    return res.json({
      success: true,
      message: 'Admin token is valid',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        iat: decoded?.iat,
        exp: decoded?.exp
      }
    });
  } catch (error: any) {
    console.error('Verify admin token error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Admin token verification failed'
    });
  }
};