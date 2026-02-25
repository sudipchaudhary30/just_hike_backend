import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import trekRoutes from "./routes/trek.route";
import guideRoutes from "./routes/guide.route";
import bookingRoutes from "./routes/booking.route";
import blogRoutes from "./routes/blog.route";

dotenv.config();
console.log(process.env.PORT);
 
const app: Application = express();
 
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the api of just_hike" });
});

app.use("/uploads", express.static('C:/Users/Victus/Documents/Developers/API/JustHike_Backend/uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);


export { app };