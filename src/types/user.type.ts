export interface UserType {
    email: string;
    password: string;
   
    role?: 'admin' | 'guide' | 'user';
    profilePicture?: string;
    createdAt?: Date;
    updatedAt?: Date;
}