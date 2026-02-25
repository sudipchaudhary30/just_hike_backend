import { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    let imageFileName;
    if (req.file && req.file.fieldname === "profilePicture") {
      imageFileName = req.file.filename;
    }
    const user = await UserModel.create({
      name,
      email,
      imageFileName,
    });
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...user.toObject(),
        imageUrl: imageFileName ? `/uploads/users/${imageFileName}` : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    let updateData: any = {};
    let imageFileName;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (req.file && req.file.fieldname === "profilePicture") {
      imageFileName = req.file.filename;
      updateData.imageFileName = imageFileName;
      delete updateData.imageUrl;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      data: {
        ...updatedUser.toObject(),
        imageUrl: imageFileName ? `/uploads/users/${imageFileName}` : (updatedUser.imageFileName ? `/uploads/users/${updatedUser.imageFileName}` : null),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};