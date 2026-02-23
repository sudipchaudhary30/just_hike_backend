import mongoose, { Document, Schema } from "mongoose";

export interface IGuide extends Document {
  name: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  experienceYears?: number;
  languages?: string[];
  imageUrl?: string;
  imageFileName?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GuideSchema = new Schema<IGuide>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    bio: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    languages: { type: [String], default: [] },
    imageFileName: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const GuideModel = mongoose.model<IGuide>("Guide", GuideSchema);
