import mongoose, { Document, Schema } from "mongoose";

export interface ITrek extends Document {
  title: string;
  description: string;
  overview?: string;
  itinerary?: string;
  difficulty?: string;
  durationDays: number;
  price: number;
  location: string;
  maxGroupSize?: number;
  isActive?: boolean;
  imageFileName?: string;
  thumbnailFileName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  thumbnailUrl?: string;
  trekImage?: string; // <-- must be String, not Object or Mixed
}

const TrekSchema = new Schema<ITrek>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, trim: true },
    itinerary: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      default: "moderate",
    },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    maxGroupSize: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    trekImage: { type: String }, // <-- must be String, not Object, not Mixed
    imageUrl: { type: String },
    thumbnailUrl: { type: String }, // <-- Add this line
  },
  { timestamps: true }
);

export const TrekModel = mongoose.model<ITrek>("Trek", TrekSchema);

