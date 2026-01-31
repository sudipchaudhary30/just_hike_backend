import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  trek: mongoose.Types.ObjectId;
  guide?: mongoose.Types.ObjectId;
  startDate: Date;
  participants: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trek: { type: Schema.Types.ObjectId, ref: "Trek", required: true },
    guide: { type: Schema.Types.ObjectId, ref: "Guide" },
    startDate: { type: Date, required: true },
    participants: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);
