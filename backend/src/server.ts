import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`[server] TeleMedicine AI Decision-Support API running on http://localhost:${env.port}`);
  console.log(`[server] Swagger docs available at http://localhost:${env.port}/api-docs`);
  console.log(`[server] Health check at http://localhost:${env.port}/api/health`);
  console.log(`[server] Mode: ${env.nodeEnv}`);
});
