import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config.js";
import { errorHandler } from "./lib/http.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { commonRouter } from "./routes/commonRoutes.js";
import { publicRouter } from "./routes/publicRoutes.js";
import { studentRouter } from "./routes/studentRoutes.js";
import { teacherRouter } from "./routes/teacherRoutes.js";
import { resourceRouter } from "./routes/resourceRoutes.js";
export const app = express();
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        const allowedOrigins = [env.CLIENT_URL, env.ADMIN_CLIENT_URL];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
}));
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
}), authRouter);
app.use("/api/public", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
}), publicRouter);
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "learnhub-api",
        time: new Date().toISOString(),
    });
});
app.use("/api/common", commonRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
app.use("/api/resources", resourceRouter);
app.use(errorHandler);
