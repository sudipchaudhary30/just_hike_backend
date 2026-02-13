import express , {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import trekRoutes from "./routes/trek.route";
import guideRoutes from "./routes/guide.route";
import bookingRoutes from "./routes/booking.route";
import blogRoutes from "./routes/blog.route";
import { ensureAdminUser } from "./services/admin-seed";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
 
dotenv.config();
console.log(process.env.PORT);
 
const app: Application = express();
 
let corsOptions={
    origin:["http://localhost:3000","http://localhost:3001"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    //which url can access backend
    //put your frontend domain/url here
}
//origin:"*",//yo le sabai url lai access dincha
app.use(cors(corsOptions));
app.use(cookieParser());
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the api of just_hike" });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);
 
async function start() {
    await connectDatabase();
    await ensureAdminUser();
 
    app.listen(
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}
 
start().catch((error) => console.log(error));
 