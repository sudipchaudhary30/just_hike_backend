import { Request, Response } from "express";
import { BlogModel } from "../models/blog.model";

const buildImageUrl = (req: Request, filename: string) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const createData: any = {
      title,
      content,
      excerpt,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      status: status || "draft",
      author: (req.user as any)?._id || (req.user as any)?.id,
    };

    let imageUrl;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/blogs/${req.file.filename}`;
      createData.imageUrl = imageUrl;
      createData.thumbnailUrl = imageUrl;
    }

    const blog = await BlogModel.create(createData);

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: {
        ...blog.toObject(),
        imageFileName: req.file ? req.file.filename : null,
        imageUrl: imageUrl || null,
        thumbnailFileName: req.file ? req.file.filename : null,
        thumbnailUrl: imageUrl || null,
      },
    });
  } catch (error: any) {
    console.error("Create blog error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create blog",
    });
  }
};

export const getAllBlogs = async (_req: Request, res: Response) => {
  try {
    const blogs = await BlogModel.find({ status: "published" });
    const blogsWithUrls = blogs.map(blog => {
      const blogObj = blog.toObject();
      const imageUrl = blogObj.imageUrl || (blogObj.imageFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.imageFileName}` : null);
      const thumbnailUrl = blogObj.thumbnailUrl || (blogObj.thumbnailFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.thumbnailFileName}` : null);
      return {
        ...blogObj,
        imageUrl,
        thumbnailUrl,
      };
    });
    return res.json({
      success: true,
      message: "Blogs fetched successfully",
      data: blogsWithUrls,
    });
  } catch (error: any) {
    console.error("Get blogs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blogs",
    });
  }
};

export const getAllBlogsAdmin = async (_req: Request, res: Response) => {
  try {
    const blogs = await BlogModel.find();
    const blogsWithUrls = blogs.map(blog => {
      const blogObj = blog.toObject();
      const imageUrl = blogObj.imageUrl || (blogObj.imageFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.imageFileName}` : null);
      const thumbnailUrl = blogObj.thumbnailUrl || (blogObj.thumbnailFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.thumbnailFileName}` : null);
      return {
        ...blogObj,
        imageUrl,
        thumbnailUrl,
      };
    });
    return res.json({
      success: true,
      message: "Blogs fetched successfully",
      data: blogsWithUrls,
    });
  } catch (error: any) {
    console.error("Get blogs admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blogs",
    });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog || blog.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }
    const blogObj = blog.toObject();
    const imageUrl = blogObj.imageUrl || (blogObj.imageFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.imageFileName}` : null);
    const thumbnailUrl = blogObj.thumbnailUrl || (blogObj.thumbnailFileName ? `${process.env.BASE_URL || 'http://localhost:5050'}/uploads/blogs/${blogObj.thumbnailFileName}` : null);
    return res.json({
      success: true,
      message: "Blog fetched successfully",
      data: {
        ...blogObj,
        imageUrl,
        thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error("Get blog by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blog",
    });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];
    if (status) updateData.status = status;

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

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error: any) {
    console.error("Update blog error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update blog",
    });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const deletedBlog = await BlogModel.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete blog error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete blog",
    });
  }
};
