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
    if (error instanceof ZodError) {
        const detail = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
            message: `Validation failed: ${detail}`,
            errors: error.flatten(),
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
