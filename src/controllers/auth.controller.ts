import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/user.model';
import { JWT_SECRET } from '../config';
import { sendEmail } from '../config/email';

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

    const existingUser = await UserModel.findById(targetUserId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

// FORGOT PASSWORD (PUBLIC)
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security reasons
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log(`[FORGOT PASSWORD] Email: ${email}`);
    console.log(`[FORGOT PASSWORD] Generated token: ${resetToken.substring(0, 10)}...`);
    console.log(`[FORGOT PASSWORD] Hashed token: ${hashedToken.substring(0, 10)}...`);

    // Set token and expiry (1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000);
    
    const updateResult = await UserModel.updateOne(
      { email },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt
      }
    );

    console.log(`[FORGOT PASSWORD] Token saved to DB for ${email}`);
    console.log(`[FORGOT PASSWORD] Expiry set to: ${expiresAt.toISOString()}`);

    // Create reset URL pointing to frontend
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}&email=${email}`;

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">JustHike - Your Adventure Awaits</p>
      </div>
    `;

    // Send email
    try {
      await sendEmail(user.email, 'Password Reset Request', emailHtml);
      console.log(`Password reset email sent to: ${user.email}`);
    } catch (emailError: any) {
      console.error('Failed to send email:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process password reset request'
    });
  }
};

// RESET PASSWORD (PUBLIC)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Support token from path param, query param, OR body
    const token = (req.params.token || req.query.token || req.body.token) as string;
    const { newPassword, password } = req.body;
    
    // Accept both newPassword (frontend) and password (backward compatibility)
    const passwordToUse = newPassword || password;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!passwordToUse) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (passwordToUse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log(`[RESET PASSWORD] Received token: ${token.substring(0, 10)}...`);
    console.log(`[RESET PASSWORD] Hashed to: ${hashedToken.substring(0, 10)}...`);
    console.log(`[RESET PASSWORD] Current timestamp: ${Date.now()}`);

    // Find user with valid token and not expired
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`[RESET PASSWORD] User with valid token not found!`);
      console.log(`[RESET PASSWORD] Looking for hashedToken: ${hashedToken.substring(0, 10)}...`);
      
      // Debug: check if token exists at all, even if expired
      const allUsers = await UserModel.findOne({ resetPasswordToken: hashedToken });
      if (allUsers) {
        console.log(`[RESET PASSWORD] Token found but EXPIRED. Expires: ${allUsers.resetPasswordExpires}`);
      } else {
        console.log(`[RESET PASSWORD] Token not found in any user record`);
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.log(`[RESET PASSWORD] Valid user found: ${user.email}`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    // Update password and clear reset token fields
    await UserModel.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    );

    console.log(`[RESET PASSWORD] Password reset successfully for ${user.email}`);

    // Send confirmation email
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Hello ${user.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">JustHike - Your Adventure Awaits</p>
      </div>
    `;

    await sendEmail(user.email, 'Password Reset Successful', confirmationHtml);

    return res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};
