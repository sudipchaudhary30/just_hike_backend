import { Request, Response } from "express";
import { TrekModel } from "../models/trek.model";

const buildImageUrl = (req: Request, filename: string) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

export const createTrek = async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, durationDays, price, location, maxGroupSize, isActive } = req.body;

    if (!title || !description || !durationDays || !price || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, description, durationDays, price and location are required",
      });
    }

    const createData: any = {
      title,
      description,
      difficulty,
      durationDays: Number(durationDays),
      price: Number(price),
      location,
      maxGroupSize: maxGroupSize ? Number(maxGroupSize) : undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
      createdBy: (req.user as any)?._id || (req.user as any)?.id,
    };

    if (req.file) {
      const imageUrl = buildImageUrl(req, req.file.filename);
      createData.imageUrl = imageUrl;
      createData.thumbnailUrl = imageUrl; // reuse stored image for thumbnail
    }

    const trek = await TrekModel.create(createData);

    return res.status(201).json({
      success: true,
      message: "Trek created successfully",
      data: trek,
    });
  } catch (error: any) {
    console.error("Create trek error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create trek",
    });
  }
};

export const getAllTreks = async (_req: Request, res: Response) => {
  try {
    const treks = await TrekModel.find({ isActive: true });
    return res.json({
      success: true,
      message: "Treks fetched successfully",
      data: treks,
    });
  } catch (error: any) {
    console.error("Get treks error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch treks",
    });
  }
};

export const getTrekById = async (req: Request, res: Response) => {
  try {
    const trek = await TrekModel.findById(req.params.id);
    if (!trek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }

    return res.json({
      success: true,
      message: "Trek fetched successfully",
      data: trek,
    });
  } catch (error: any) {
    console.error("Get trek by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch trek",
    });
  }
};

export const updateTrek = async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, durationDays, price, location, maxGroupSize, isActive } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (difficulty) updateData.difficulty = difficulty;
    if (durationDays !== undefined) updateData.durationDays = Number(durationDays);
    if (price !== undefined) updateData.price = Number(price);
    if (location) updateData.location = location;
    if (maxGroupSize !== undefined) updateData.maxGroupSize = Number(maxGroupSize);
    if (isActive !== undefined) updateData.isActive = isActive;

    if (req.file) {
      const imageUrl = buildImageUrl(req, req.file.filename);
      updateData.imageUrl = imageUrl;
      updateData.thumbnailUrl = imageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedTrek = await TrekModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTrek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }

    return res.json({
      success: true,
      message: "Trek updated successfully",
      data: updatedTrek,
    });
  } catch (error: any) {
    console.error("Update trek error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update trek",
    });
  }
};

export const deleteTrek = async (req: Request, res: Response) => {
  try {
    const deletedTrek = await TrekModel.findByIdAndDelete(req.params.id);
    if (!deletedTrek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }

    return res.json({
      success: true,
      message: "Trek deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete trek error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete trek",
    });
  }
};
