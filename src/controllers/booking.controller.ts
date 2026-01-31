import { Request, Response } from "express";
import { BookingModel } from "../models/booking.model";
import { TrekModel } from "../models/trek.model";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    const { trekId, startDate, participants } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!trekId || !startDate || !participants) {
      return res.status(400).json({
        success: false,
        message: "trekId, startDate, participants are required",
      });
    }

    const trek = await TrekModel.findById(trekId);
    if (!trek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }

    const totalPrice = Number(participants) * Number(trek.price);

    const booking = await BookingModel.create({
      user: userId,
      trek: trekId,
      startDate: new Date(startDate),
      participants: Number(participants),
      totalPrice,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking",
    });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const bookings = await BookingModel.find({ user: userId })
      .populate("trek")
      .populate("guide");

    return res.json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error: any) {
    console.error("Get my bookings error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
};

export const getMyBookingById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    const booking = await BookingModel.findOne({ _id: req.params.id, user: userId })
      .populate("trek")
      .populate("guide");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Get my booking by id error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking",
    });
  }
};

export const updateMyBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    const { startDate, participants } = req.body;

    const booking = await BookingModel.findOne({ _id: req.params.id, user: userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be updated",
      });
    }

    if (startDate) booking.startDate = new Date(startDate);
    if (participants) {
      booking.participants = Number(participants);
      const trek = await TrekModel.findById(booking.trek);
      if (trek) booking.totalPrice = Number(booking.participants) * Number(trek.price);
    }

    await booking.save();

    return res.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Update my booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking",
    });
  }
};

export const cancelMyBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    const booking = await BookingModel.findOne({ _id: req.params.id, user: userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Cancel my booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
};

export const getAllBookingsAdmin = async (_req: Request, res: Response) => {
  try {
    const bookings = await BookingModel.find()
      .populate("trek")
      .populate("guide")
      .populate("user");

    return res.json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error: any) {
    console.error("Get all bookings admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
};

export const getBookingByIdAdmin = async (req: Request, res: Response) => {
  try {
    const booking = await BookingModel.findById(req.params.id)
      .populate("trek")
      .populate("guide")
      .populate("user");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Get booking by id admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking",
    });
  }
};

export const updateBookingAdmin = async (req: Request, res: Response) => {
  try {
    const { status, guideId } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (guideId) updateData.guide = guideId;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("trek")
      .populate("guide")
      .populate("user");

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error: any) {
    console.error("Update booking admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking",
    });
  }
};

export const deleteBookingAdmin = async (req: Request, res: Response) => {
  try {
    const deletedBooking = await BookingModel.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete booking admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete booking",
    });
  }
};
