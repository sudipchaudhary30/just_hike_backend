import { Request, Response } from "express";
import { TrekModel } from "../models/trek.model";

const buildImageUrl = (req: Request, filename: string) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

const extractFileName = (url: string) => {
  if (!url) return undefined;
  const parts = url.split("/");
  return parts[parts.length - 1];
};

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

    let imageUrl, thumbnailUrl;
    if (req.file) {
      createData.imageFileName = req.file.filename;
      createData.thumbnailFileName = req.file.filename;
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/treks/${req.file.filename}`;
      thumbnailUrl = imageUrl;
    } else {
      console.error("No file uploaded for trek!");
    }

    const trek = await TrekModel.create(createData);
    return res.status(201).json({
      success: true,
      message: "Trek created successfully",
      data: {
        ...trek.toObject(),
        imageFileName: trek.imageFileName,
        imageUrl: imageUrl || null,
        thumbnailFileName: trek.thumbnailFileName,
        thumbnailUrl: thumbnailUrl || null,
      },
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
    const treksWithFileNames = treks.map(trek => {
      const trekObj = trek.toObject();
      return {
        ...trekObj,
        imageFileName: trekObj.imageFileName,
        thumbnailFileName: trekObj.thumbnailFileName,
      };
    });
    return res.json({
      success: true,
      message: "Treks fetched successfully",
      data: treksWithFileNames,
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
      data: {
        ...trek.toObject(),
        imageFileName: trek.imageFileName,
        thumbnailFileName: trek.thumbnailFileName,
      },
    });
  } catch (error: any) {
    console.error("Get trek by ID error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch trek",
    });
  }
};

export const updateTrek = async (req: Request, res: Response) => {
  try {
    const trek = await TrekModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!trek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }
    return res.json({
      success: true,
      message: "Trek updated successfully",
      data: {
        ...trek.toObject(),
        imageFileName: trek.imageFileName,
        thumbnailFileName: trek.thumbnailFileName,
      },
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
