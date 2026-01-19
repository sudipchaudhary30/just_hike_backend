import z from 'zod';

export const UserSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    profilePicture: z.string().optional(),
    phoneNumber: z.string().optional(),
    role: z.enum(['admin', 'guide', 'user']).default('user'),
});
export type UserType = z.infer<typeof UserSchema>;