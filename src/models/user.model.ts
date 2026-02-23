import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";

const UserSchema: Schema = new Schema<UserType>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        phoneNumber: {type: String, default: "9846676138", trim: true},
        role: {
            type: String,
            enum: ['admin', 'guide', 'user'],
            default: 'user',
        },
        profilePicture: {
            type: String,
            default: "default-profile.png",
            trim: true,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, 
    }
);

// Add this method to remove password when converting to JSON
UserSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

export interface IUser extends UserType, Document { 
    _id: mongoose.Types.ObjectId; 
    updatedAt: Date;
    createdAt: Date;
}

export interface IUser {
    name: string;
    email: string;
    imageUrl?: string; // <-- Add this line
}

export const UserModel = mongoose.model<IUser>('User', UserSchema);