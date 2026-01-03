import z from "zod";
import { UserSchema } from "../types/user.type";

export const CreateUserDTO = UserSchema.pick(
    {
        name: true,
        email: true,
        password: true,
    }
).extend(
    {
        confirmPassword: z.string().min(6)
    }
).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
)
export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
    
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;