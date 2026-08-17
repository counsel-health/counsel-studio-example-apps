import app from "@/app";
import { getDb } from "@/db/db";
import { env, loadEnvConfig } from "@/envConfig";
import { serverLogger } from "@/lib/logger";

loadEnvConfig();

app.listen(env.PORT, () => {
  // Create the in-memory database
  getDb()
    .then(() => {
      serverLogger.info("Database initialized");
    })
    .catch((error) => {
      serverLogger.error({ err: error }, "Critical error initializing the database");
      process.exit(1);
    });

  serverLogger.info({ port: env.PORT }, `Server is running on http://localhost:${env.PORT}`);
});
