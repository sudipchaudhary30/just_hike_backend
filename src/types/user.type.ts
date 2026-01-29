import z from "zod";

export const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    phoneNumber: z.string().optional(),
    role: z.enum(['admin', 'guide', 'user']).optional(),
    profilePicture: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export interface UserType {
    email: string;
    password: string;
    name: string;
    phoneNumber?: string;
    role?: 'admin' | 'guide' | 'user';
    profilePicture?: string;
    createdAt?: Date;
    updatedAt?: Date;
}