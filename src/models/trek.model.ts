import mongoose, { Document, Schema } from "mongoose";

export interface ITrek extends Document {
  title: string;
  description: string;
  difficulty: "easy" | "moderate" | "hard";
  durationDays: number;
  price: number;
  location: string;
  maxGroupSize?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TrekSchema = new Schema<ITrek>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      default: "moderate",
    },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    maxGroupSize: { type: Number, default: 10 },
    imageUrl: { type: String, trim: true },
    thumbnailUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const TrekModel = mongoose.model<ITrek>("Trek", TrekSchema);
