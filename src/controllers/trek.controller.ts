import { Request, Response } from "express";
import { TrekModel } from "../models/trek.model";

// Helper to build full image URL from relative path
function buildImageUrl(req: Request, relativePath: string): string {
  return `${req.protocol}://${req.get("host")}/${relativePath}`;
}

export const createTrek = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      overview,
      itinerary,
      difficulty,
      durationDays,
      price,
      location,
      maxGroupSize,
      isActive,
      createdBy,
    } = req.body;

    // Always set these fields, even if no image is uploaded
    let imageUrl = "";
    let thumbnailUrl = "";
    if (req.file && req.file.fieldname === "trekImage") {
      imageUrl = `uploads/treks/${req.file.filename}`;
      thumbnailUrl = `uploads/treks/${req.file.filename}`;
    }

    const trek = await TrekModel.create({
      title,
      description,
      overview,
      itinerary,
      difficulty,
      durationDays,
      price,
      location,
      maxGroupSize,
      isActive,
      createdBy,
      imageUrl, // relative path or empty string
      name: title,
      thumbnailUrl, // relative path or empty string
    });

    // Build response with full URLs
    const trekObj = trek.toObject();
    trekObj.imageUrl = trekObj.imageUrl ? buildImageUrl(req, trekObj.imageUrl) : "";
    trekObj.thumbnailUrl = trekObj.thumbnailUrl ? buildImageUrl(req, trekObj.thumbnailUrl) : "";

    return res.status(201).json(trekObj);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create trek",
    });
  }
};

export const getAllTreks = async (req: Request, res: Response) => {
  try {
    const treks = await TrekModel.find({ isActive: true });
    
    // Enhance treks with full image URLs if needed
    const enhancedTreks = treks.map(trek => {
      const trekObj = trek.toObject() as any;
      
      // If imageUrl is not set but imageFileName exists, build the URL
      if (!trekObj.imageUrl && trekObj.imageFileName) {
        trekObj.imageUrl = buildImageUrl(req, trekObj.imageFileName);
      }
      if (!trekObj.thumbnailUrl && trekObj.thumbnailFileName) {
        trekObj.thumbnailUrl = buildImageUrl(req, trekObj.thumbnailFileName);
      }
      
      return trekObj;
    });
    
    return res.json({
      success: true,
      message: "Treks fetched successfully",
      data: enhancedTreks,
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
    
    const trekObj = trek.toObject() as any;
    
    // Ensure image URLs are present
    if (trekObj.imageUrl) {
      trekObj.imageUrl = buildImageUrl(req, trekObj.imageUrl);
    }
    if (trekObj.thumbnailUrl) {
      trekObj.thumbnailUrl = buildImageUrl(req, trekObj.thumbnailUrl);
    }
    
    return res.json({
      success: true,
      message: "Trek fetched successfully",
      data: trekObj,
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
    // Always update as string paths
    if (req.file) {
      req.body.imageUrl = `uploads/treks/${req.file.filename}`;
      req.body.thumbnailUrl = `uploads/treks/${req.file.filename}`;
    }

    // Always set name to title if present
    if (req.body.title) {
      req.body.name = req.body.title;
    }

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

    const trekObj = trek.toObject();
    trekObj.imageUrl = trekObj.imageUrl ? buildImageUrl(req, trekObj.imageUrl) : "";
    trekObj.thumbnailUrl = trekObj.thumbnailUrl ? buildImageUrl(req, trekObj.thumbnailUrl) : "";

    return res.json(trekObj);
  } catch (error: any) {
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