import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { ExpressAuth } from "@auth/express";

import { env } from "./config/env.js";
import { authConfig } from "./config/auth.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  if (!env.isProd) app.use(morgan("dev"));

  // Auth.js must be mounted BEFORE the body parsers (it reads the raw request itself).
  app.use("/auth/*", ExpressAuth(authConfig));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  fs.mkdirSync(env.uploadsDir, { recursive: true });
  app.use("/uploads", express.static(env.uploadsDir, { maxAge: "7d" }));

  app.use("/api", routes);
  app.use("/api", notFound);

  // Production: serve the built React app from the same origin (cookies "just work").
  const clientDist = path.resolve(env.uploadsDir, "../../client/dist");
  if (env.isProd && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  app.use(errorHandler);
  return app;
}
