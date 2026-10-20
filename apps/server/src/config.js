import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/learnhub"),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    GOOGLE_CLIENT_ID: z.string().default(""),
    SEED_DEMO_DATA: z.enum(["true", "false"]).default("false"),
    JWT_SECRET: z.string().min(16).default("learnhub_dev_secret_please_change"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    INITIAL_ADMIN_SETUP_KEY: z.string().default("learnhub-setup-key"),
});
export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
