import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getMyBookingById,
  updateMyBooking,
  cancelMyBooking,
  getAllBookingsAdmin,
  getBookingByIdAdmin,
  updateBookingAdmin,
  deleteBookingAdmin,
} from "../controllers/booking.controller";
import { authorizedMiddleware, adminOnlyMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// User booking APIs
router.post("/", authorizedMiddleware, createBooking);
router.get("/", authorizedMiddleware, getMyBookings);
router.get("/:id", authorizedMiddleware, getMyBookingById);
router.put("/:id", authorizedMiddleware, updateMyBooking);
router.delete("/:id", authorizedMiddleware, cancelMyBooking);

// Admin booking management APIs
router.get("/admin/all", authorizedMiddleware, adminOnlyMiddleware, getAllBookingsAdmin);
router.get("/admin/:id", authorizedMiddleware, adminOnlyMiddleware, getBookingByIdAdmin);
router.put("/admin/:id", authorizedMiddleware, adminOnlyMiddleware, updateBookingAdmin);
router.delete("/admin/:id", authorizedMiddleware, adminOnlyMiddleware, deleteBookingAdmin);

export default router;
