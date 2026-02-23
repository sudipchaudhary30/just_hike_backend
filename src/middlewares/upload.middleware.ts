import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
// Ensure the uploads/treks directory exists
const baseUploadDir = path.join(__dirname, "../../uploads");
const trekUploadDir = path.join(baseUploadDir, "treks");
const guideUploadDir = path.join(baseUploadDir, "guides");
const blogUploadDir = path.join(baseUploadDir, "blogs");
const userUploadDir = path.join(baseUploadDir, "users");

[trekUploadDir, guideUploadDir, blogUploadDir, userUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Choose directory based on field name and route
    let dest = baseUploadDir;
    // Check URL path to determine entity type
    if (req.baseUrl.includes("trek")) dest = trekUploadDir;
    else if (req.baseUrl.includes("blog")) dest = blogUploadDir;
    else if (req.baseUrl.includes("guide")) dest = guideUploadDir;
    else if (req.baseUrl.includes("user")) dest = userUploadDir;
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploads = {
  single: (fieldName: string) => upload.single(fieldName),
  array: (fieldName: string, maxCount: number) =>
    upload.array(fieldName, maxCount),
  fields: (fieldsArray: { name: string; maxCount?: number }[]) =>
    upload.fields(fieldsArray),
};