import { Request, Response } from "express";
import { GuideModel } from "../models/guide.model";

const buildImageUrl = (req: Request, filename: string) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

export const createGuide = async (req: Request, res: Response) => {
  try {
    const { name, email, phoneNumber, bio, experienceYears, languages } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const createData: any = {
      name,
      email,
      phoneNumber,
      bio,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      languages: Array.isArray(languages) ? languages : languages ? [languages] : [],
      createdBy: (req.user as any)?._id || (req.user as any)?.id,
    };

    let imageUrl;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/guides/${req.file.filename}`;
      createData.imageUrl = imageUrl;
    }

    const guide = await GuideModel.create(createData);

    return res.status(201).json({
      success: true,
      message: "Guide created successfully",
      data: {
        ...guide.toObject(),
        imageFileName: req.file ? req.file.filename : null,
        imageUrl: imageUrl || null,
      },
    });
  } catch (error: any) {
    console.error("Create guide error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create guide",
    });
  }
};

export const getAllGuides = async (_req: Request, res: Response) => {
  try {
    const guides = await GuideModel.find();
    return res.json({
      success: true,
      message: "Guides fetched successfully",
      data: guides,
    });
  } catch (error: any) {
    console.error("Get guides error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch guides",
    });
  }
};

export const getGuideById = async (req: Request, res: Response) => {
  try {
    const guide = await GuideModel.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Guide not found",
      });
    }

    return res.json({
      success: true,
      message: "Guide fetched successfully",
      data: guide,
    });
  } catch (error: any) {
    console.error("Get guide by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch guide",
    });
  }
};

export const updateGuide = async (req: Request, res: Response) => {
  try {
    const { name, email, phoneNumber, bio, experienceYears, languages } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (bio) updateData.bio = bio;
    if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);
    if (languages !== undefined) {
      updateData.languages = Array.isArray(languages) ? languages : [languages];
    }

    let imageUrl;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/guides/${req.file.filename}`;
      updateData.imageUrl = imageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedGuide = await GuideModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGuide) {
      return res.status(404).json({
        success: false,
        message: "Guide not found",
      });
    }

    return res.json({
      success: true,
      message: "Guide updated successfully",
      data: {
        ...updatedGuide.toObject(),
        imageFileName: req.file
          ? req.file.filename
          : updatedGuide.imageUrl
            ? updatedGuide.imageUrl.split('/').pop()
            : null,
        imageUrl: imageUrl || updatedGuide.imageUrl || null,
      },
    });
  } catch (error: any) {
    console.error("Update guide error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update guide",
    });
  }
};

export const deleteGuide = async (req: Request, res: Response) => {
  try {
    const deletedGuide = await GuideModel.findByIdAndDelete(req.params.id);
    if (!deletedGuide) {
      return res.status(404).json({
        success: false,
        message: "Guide not found",
      });
    }

    return res.json({
      success: true,
      message: "Guide deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete guide error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete guide",
    });
  }
};

export const getGuides = async (req: Request, res: Response) => {
  try {
    const guides = await GuideModel.find();
    const host = `${req.protocol}://${req.get("host")}`;
    const guidesWithImageUrl = guides.map(guide => {
      let imageUrl = null;
      if (guide.imageUrl) {
        // Ensure imageUrl is a full URL
        const filename = guide.imageUrl.split("/").pop();
        imageUrl = `${host}/uploads/guides/${filename}`;
      }
      return {
        ...guide.toObject(),
        imageUrl,
      };
    });
    return res.json({
      success: true,
      data: guidesWithImageUrl,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch guides",
    });
  }
};
