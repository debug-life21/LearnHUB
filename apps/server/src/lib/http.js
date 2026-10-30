import { ZodError } from "zod";
export class ApiError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
export function asyncHandler(handler) {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError || error?.name === "ZodError") {
        const issues = error.issues || error.errors || [];
        const detail = issues.map(e => `${(e.path && e.path.join('.')) || 'field'}: ${e.message}`).join(', ');
        return res.status(400).json({
            message: detail || "Validation failed.",
            errors: typeof error.flatten === "function" ? error.flatten() : issues,
        });
    }
    if (error?.name === "ValidationError") {
        const detail = Object.values(error.errors || {}).map(e => e.message).join(', ');
        return res.status(400).json({
            message: detail || "Validation failed.",
        });
    }
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }
    console.error(error);
    return res.status(500).json({
        message: "Something went wrong on the server.",
    });
}
