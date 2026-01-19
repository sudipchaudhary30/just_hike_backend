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