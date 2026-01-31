import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../database/mongodb";
import { UserModel } from "../models/user.model";

const ADMIN_EMAIL = "admin@justhike.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "JustHike Admin";

export const ensureAdminUser = async () => {
  const existing = await UserModel.findOne({ email: ADMIN_EMAIL });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await UserModel.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created:", ADMIN_EMAIL);
    return;
  }

  const updates: Record<string, any> = {};

  if (existing.role !== "admin") {
    updates.role = "admin";
  }

  // Always reset password to the requested value
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  updates.password = hashedPassword;

  if (Object.keys(updates).length > 0) {
    await UserModel.findByIdAndUpdate(existing._id, updates, {
      new: true,
      runValidators: true,
    });

    console.log("Admin user updated:", ADMIN_EMAIL);
  }
};

export const runAdminSeed = async () => {
  await connectDatabase();
  await ensureAdminUser();
  await mongoose.connection.close();
};
