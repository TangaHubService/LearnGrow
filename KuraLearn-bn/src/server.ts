import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initializeSocket } from "./services/socket.js";

const app = createApp();
const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`KuraLearn API running on port ${env.PORT}`);
});
