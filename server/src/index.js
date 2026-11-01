import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDB();
  createApp().listen(env.port, () => console.log(`[server] http://localhost:${env.port}  (ML: ${env.mlMock ? "MOCK" : env.mlApiUrl})`));
}

main().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
