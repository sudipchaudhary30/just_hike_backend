import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";

export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createData: any = {
      name,
      email,
      password: hashedPassword,
    };

    if (phoneNumber) createData.phoneNumber = phoneNumber;
    if (role) createData.role = role;
    if (req.file) createData.profilePicture = req.file.filename;

    const user = await UserModel.create(createData);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Create user by admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
};

export const getAllUsersByAdmin = async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.find();
    return res.json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error: any) {
    console.error("Get all users by admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
};

export const getUserByIdByAdmin = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Get user by id (admin) error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

export const updateUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePicture = req.file.filename;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Update user by admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete user by admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};
