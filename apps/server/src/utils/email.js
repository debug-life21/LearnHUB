import nodemailer from "nodemailer";
import { env } from "../config.js";
import { ApiError } from "../lib/http.js";

let transporter;

function getTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        throw new ApiError(503, "Email delivery is not configured. Contact the site administrator.");
    }
    transporter ??= nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return transporter;
}

export async function sendVerificationCode({ email, name, code }) {
    const escapedName = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    try {
        await getTransporter().sendMail({
            from: env.SMTP_USER,
            to: email,
            subject: "Your LearnHUB verification code",
            text: `Hello ${name}, your LearnHUB verification code is ${code}. It expires in 10 minutes.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0f172a"><h1 style="font-size:22px">Verify your LearnHUB account</h1><p>Hello ${escapedName},</p><p>Enter this code to continue. It expires in <strong>10 minutes</strong>.</p><div style="background:#eff6ff;border-radius:12px;padding:18px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px;color:#1d4ed8">${code}</div><p style="font-size:13px;color:#475569">If you did not request this code, you can safely ignore this email.</p></div>`,
        });
    } catch (error) {
        console.error("Verification email delivery failed.", error);
        throw new ApiError(503, "Verification email could not be sent. Please try again shortly.");
    }
}
