import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user.type";
const UserSchema: Schema = new Schema<UserType>(
    {
      
        }
    },
    {
        timestamps: true, 
    }
);

export interface IUser extends UserType, Document { 
    _id: mongoose.Types.ObjectId; 
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>('User', UserSchema);
