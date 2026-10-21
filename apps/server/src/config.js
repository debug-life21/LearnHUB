import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    MONGO_URI: z.string().optional(),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/learnhub"),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    GOOGLE_CLIENT_ID: z.string().default(""),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    ADMIN_EMAIL: z.string().default(""),
    ADMIN_PASSWORD: z.string().default(""),
    SEED_DEMO_DATA: z.enum(["true", "false"]).default("false"),
    JWT_SECRET: z.string().min(16).default("learnhub_dev_secret_please_change"),
    JWT_EXPIRES_IN: z.string().default("7d"),
});
export const env = envSchema.parse(process.env);
env.MONGODB_URI = env.MONGO_URI || env.MONGODB_URI;
export const isProduction = env.NODE_ENV === "production";
