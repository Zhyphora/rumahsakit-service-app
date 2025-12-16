import "reflect-metadata";
import express from "express";
import cors from "cors";
import http from "http";
import localtunnel from "localtunnel";
import { env } from "./config/env";
import { AppDataSource } from "./config/database";
import { initializeWebSocket } from "./config/websocket";
import routes from "./routes";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use("/uploads", express.static(env.upload.dir));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize WebSocket
initializeWebSocket(server);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Start HTTP server
    server.listen(env.port, async () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);

      // Start LocalTunnel for public access
      if (env.nodeEnv === "development") {
        try {
          const tunnel = await localtunnel({
            port: env.port,
            subdomain: env.localTunnel.subdomain,
          });

          console.log(`🌐 LocalTunnel URL: ${tunnel.url}`);
          console.log(
            `📺 Queue Display (Public): ${tunnel.url}/api/queue/display`
          );

          tunnel.on("close", () => {
            console.log("LocalTunnel closed");
          });
        } catch (error) {
          console.log("⚠️ LocalTunnel not available, running locally only");
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
