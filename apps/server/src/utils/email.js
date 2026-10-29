import nodemailer from "nodemailer";
import { env, isProduction } from "../config.js";
import { ApiError } from "../lib/http.js";

let transporter;

function getTransporter() {
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const smtpPass = (env.SMTP_PASS?.trim() || "iakgmhpfzlvyavcw").replace(/\s+/g, "");
    if (!smtpUser || !smtpPass) {
        if (!isProduction) {
            return null;
        }
        console.warn("[Mailer] SMTP credentials missing in production. Falling back to log-based verification.");
        return null;
    }
    if (!transporter) {
        const isGmail = (env.SMTP_HOST || "").toLowerCase().includes("gmail") || smtpUser.endsWith("@gmail.com");
        transporter = nodemailer.createTransport({
            host: isGmail ? "smtp.gmail.com" : (env.SMTP_HOST || "smtp.gmail.com"),
            port: isGmail ? 465 : (Number(env.SMTP_PORT) || 465),
            secure: isGmail ? true : (Number(env.SMTP_PORT) === 465),
            family: 4, // CRITICAL: Forces IPv4 to bypass 30-40s system IPv6 DNS timeout
            pool: true, // Keeps connection pool alive for instant subsequent sends
            maxConnections: 5,
            maxMessages: 100,
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 15000,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
        });
    }
    return transporter;
}

function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function emailWrapper(title, content) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:linear-gradient(135deg,#091a2f 0%,#0f2942 100%);padding:28px 32px;text-align:center;">
      <div style="display:inline-block;padding:8px 16px;background:rgba(255,255,255,0.12);border-radius:10px;color:#38bdf8;font-weight:900;font-size:18px;letter-spacing:1px;">
        TedbabeLearnHUB (TLH)
      </div>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;letter-spacing:0.5px;">Learn Anything. Grow Everywhere.</p>
    </div>
    <div style="padding:32px 32px 28px;">
      ${content}
    </div>
    <div style="padding:20px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} TedbabeLearnHUB (TLH) Education Platform. All rights reserved.</p>
      <p style="margin:4px 0 0;">This is an automated system email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
}

function formatFromAddress(label, smtpUser) {
    const raw = (env.SMTP_FROM || "").trim();
    if (!raw) return `"${label}" <${smtpUser}>`;
    if (/<[^>]+>/.test(raw)) return raw;
    const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        const foundEmail = emailMatch[1];
        const namePart = raw.replace(foundEmail, "").trim() || label;
        return `"${namePart}" <${foundEmail}>`;
    }
    return `"${raw}" <${smtpUser}>`;
}

export async function sendVerificationCode({ email, name, code }) {
    const escapedName = escapeHtml(name || "Learner");
    console.log(`[TedbabeLearnHUB Mailer] Verification code for ${email} (${escapedName}): [ ${code} ]`);
    const client = getTransporter();
    if (!client) {
        console.log(`[TedbabeLearnHUB Mailer] Verification email skipped (SMTP unconfigured). Use code: ${code}`);
        return;
    }
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB", smtpUser);
    try {
        await client.sendMail({
            from: fromAddress,
            to: email,
            subject: `${code} is your TedbabeLearnHUB verification code`,
            text: `Hello ${name || "Learner"},\n\nYour TedbabeLearnHUB verification code is: ${code}\n\nThis code expires in 10 minutes.\n\n— TedbabeLearnHUB Team`,
            html: emailWrapper("Account Verification", `
              <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin-top:0;">Verify your account</h1>
              <p style="font-size:14px;color:#334155;line-height:1.6;">Hello <strong>${escapedName}</strong>,</p>
              <p style="font-size:14px;color:#334155;line-height:1.6;">Welcome to TedbabeLearnHUB. Enter the 6-digit verification code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1d4ed8;font-family:monospace;">${code}</div>
              </div>
              <p style="font-size:13px;color:#64748b;line-height:1.5;">If you did not initiate this request, you can safely ignore this email.</p>
            `),
        });
        console.log(`[TedbabeLearnHUB Mailer] Verification email successfully delivered to ${email}`);
    } catch (error) {
        transporter = null;
        console.error("[TedbabeLearnHUB Mailer] Verification email delivery failed:", error?.message || error);
        console.log(`[TedbabeLearnHUB Mailer] FALLBACK - Verification code for ${email}: [ ${code} ] (Check console log for verification)`);
    }
}

export async function sendPasswordResetEmail({ email, name, resetUrl, code }) {
    const escapedName = escapeHtml(name);
    const client = getTransporter();
    if (!client) {
        console.log(`[TedbabeLearnHUB Dev Mailer] Password reset link for ${email}: ${resetUrl} (Code: ${code})`);
        return;
    }
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB Security", smtpUser);
    try {
        await client.sendMail({
            from: fromAddress,
            to: email,
            subject: "Reset your TedbabeLearnHUB password",
            text: `Hello ${name}, reset your TedbabeLearnHUB password by visiting: ${resetUrl} or using code ${code}. Valid for 15 minutes.`,
            html: emailWrapper("Password Reset Request", `
              <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin-top:0;">Reset your password</h1>
              <p style="font-size:14px;color:#334155;line-height:1.6;">Hello <strong>${escapedName}</strong>,</p>
              <p style="font-size:14px;color:#334155;line-height:1.6;">We received a request to reset the password for your TedbabeLearnHUB account. Click the button below or enter the reset code on the reset page. This link expires in <strong>15 minutes</strong>.</p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;display:inline-block;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">Reset My Password</a>
              </div>
              <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:14px;text-align:center;margin:20px 0;">
                <span style="font-size:12px;color:#64748b;">Or enter reset code:</span>
                <span style="display:block;font-size:24px;font-weight:800;letter-spacing:6px;color:#0f172a;margin-top:4px;font-family:monospace;">${code}</span>
              </div>
              <p style="font-size:13px;color:#64748b;line-height:1.5;">If you did not request a password reset, please ensure your account remains secure and ignore this email.</p>
            `),
        });
    } catch (error) {
        console.error("[TedbabeLearnHUB Mailer] Password reset email delivery failed:", error?.message || error);
        console.log(`[TedbabeLearnHUB Mailer] FALLBACK - Password reset for ${email}: URL=${resetUrl}, Code=${code}`);
    }
}

export async function sendSecurityAlertEmail({ email, name, action }) {
    const escapedName = escapeHtml(name);
    const client = getTransporter();
    if (!client) {
        console.log(`[TedbabeLearnHUB Dev Mailer] Security alert for ${email}: ${action}`);
        return;
    }
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB Security", smtpUser);
    try {
        await client.sendMail({
            from: fromAddress,
            to: email,
            subject: "Security Alert: TedbabeLearnHUB Account Update",
            text: `Hello ${name}, an important security action was performed: ${action}.`,
            html: emailWrapper("Security Alert", `
              <h1 style="font-size:20px;font-weight:800;color:#991b1b;margin-top:0;">Account Security Update</h1>
              <p style="font-size:14px;color:#334155;line-height:1.6;">Hello <strong>${escapedName}</strong>,</p>
              <p style="font-size:14px;color:#334155;line-height:1.6;">This is an alert to notify you that the following security action was recently performed on your account:</p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin:20px 0;color:#991b1b;font-weight:600;font-size:14px;">
                ${escapeHtml(action)}
              </div>
              <p style="font-size:13px;color:#64748b;line-height:1.5;">If you did not perform this change, please immediately reset your password and contact administrator support.</p>
            `),
        });
    } catch (error) {
        console.error("Security alert email delivery failed.", error);
    }
}
