import multer from "multer";
import path from "node:path";
import { HttpError } from "../utils/HttpError.js";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".bmp"]); // same set the ML API accepts
const REPORT_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

const make = (allowed, maxMb) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
    fileFilter(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (!allowed.has(ext)) {
        return cb(new HttpError(400, `Unsupported file type. Allowed: ${[...allowed].join(", ")}`));
      }
      cb(null, true);
    },
  });

export const uploadScan = make(IMAGE_EXT, 10);
export const uploadReport = make(REPORT_EXT, 10);
