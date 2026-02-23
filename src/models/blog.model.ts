import mongoose, { Document, Schema } from "mongoose";

export interface IBlog extends Document {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  imageFileName?: string;
  thumbnailFileName?: string;
  status: "draft" | "published";
  author?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true },
    tags: { type: [String], default: [] },
    imageFileName: { type: String, trim: true },
    thumbnailFileName: { type: String, trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const BlogModel = mongoose.model<IBlog>("Blog", BlogSchema);
