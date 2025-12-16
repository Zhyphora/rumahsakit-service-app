import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    name: process.env.DB_NAME || "rumahsakit",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  localTunnel: {
    subdomain: process.env.LOCALTUNNEL_SUBDOMAIN || "rumahsakit-queue",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
};
