import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

if (!process.env.AUTH_SECRET) {
  if (isProd) throw new Error("AUTH_SECRET is required in production");
  console.warn("[env] AUTH_SECRET not set - using an insecure dev fallback.");
}

export const env = {
  isProd,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dhanwantari",
  authSecret: process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mlApiUrl: (process.env.ML_API_URL || "http://127.0.0.1:8000").replace(/\/$/, ""),
  mlMock: process.env.ML_MOCK === "true",
  // Report e-mails contain no medical details. Set MAIL_ATTACH_REPORT=true to also attach the handwritten file.
  mailAttachReport: process.env.MAIL_ATTACH_REPORT === "true",
  uploadsDir: path.resolve(__dirname, "../../uploads"),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "Dhanwantari <no-reply@dhanwantari.local>",
  },
};
