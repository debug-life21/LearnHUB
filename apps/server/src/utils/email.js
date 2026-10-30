import nodemailer from "nodemailer";
import { env, isProduction } from "../config.js";
import { ApiError } from "../lib/http.js";

function getTransporters() {
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const smtpPass = (env.SMTP_PASS?.trim() || "iakgmhpfzlvyavcw").replace(/\s+/g, "");
    if (!smtpUser || !smtpPass) {
        if (!isProduction) return [];
        console.warn("[Mailer] SMTP credentials missing in production. Falling back to log-based verification.");
        return [];
    }

    // Candidate transport configurations in order of preference to guarantee delivery across all networks
    return [
        {
            name: "gmail_service",
            transporter: nodemailer.createTransport({
                service: "gmail",
                family: 4,
                connectionTimeout: 10000,
                greetingTimeout: 8000,
                socketTimeout: 15000,
                auth: { user: smtpUser, pass: smtpPass },
            }),
        },
        {
            name: "port_465_ssl",
            transporter: nodemailer.createTransport({
                host: env.SMTP_HOST || "smtp.gmail.com",
                port: 465,
                secure: true,
                family: 4,
                connectionTimeout: 10000,
                greetingTimeout: 8000,
                socketTimeout: 15000,
                auth: { user: smtpUser, pass: smtpPass },
                tls: { rejectUnauthorized: false },
            }),
        },
        {
            name: "port_587_starttls",
            transporter: nodemailer.createTransport({
                host: env.SMTP_HOST || "smtp.gmail.com",
                port: 587,
                secure: false,
                requireTLS: true,
                family: 4,
                connectionTimeout: 10000,
                greetingTimeout: 8000,
                socketTimeout: 15000,
                auth: { user: smtpUser, pass: smtpPass },
                tls: { rejectUnauthorized: false },
            }),
        },
    ];
}

async function deliverEmail(mailOptions) {
    const candidates = getTransporters();
    if (!candidates.length) {
        return { delivered: false, reason: "smtp_unconfigured" };
    }

    let lastError = null;
    for (const { name, transporter } of candidates) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[TedbabeLearnHUB Mailer] Successfully delivered via ${name} to ${mailOptions.to} (MessageId: ${info.messageId})`);
            return { delivered: true, info, method: name };
        } catch (err) {
            console.warn(`[TedbabeLearnHUB Mailer] Transport ${name} attempt failed: ${err.message || err}. Trying next candidate...`);
            lastError = err;
        }
    }
    throw lastError || new Error("All mail transports failed.");
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <div style="max-width:560px;margin:32px auto;background:#0f172a;border-radius:16px;border:1px solid #1e293b;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.4);">
    <div style="background:linear-gradient(135deg,#091a2f 0%,#0f2942 100%);padding:28px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="display:inline-block;padding:8px 18px;background:rgba(255,255,255,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:10px;color:#38bdf8;font-weight:900;font-size:18px;letter-spacing:1px;">
        TedbabeLearnHUB (TLH)
      </div>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;letter-spacing:0.5px;">Learn Anything. Grow Everywhere.</p>
    </div>
    <div style="padding:32px 32px 28px;">
      ${content}
    </div>
    <div style="padding:20px 32px;background:#090d16;border-top:1px solid #1e293b;text-align:center;font-size:12px;color:#64748b;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} TedbabeLearnHUB (TLH) Education Platform. All rights reserved.</p>
      <p style="margin:4px 0 0;">This is an automated system email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
}

function formatFromAddress(label, smtpUser) {
    const raw = (env.SMTP_FROM || "").replace(/^["']|["']$/g, "").trim();
    if (!raw) return `"${label}" <${smtpUser}>`;
    if (/<[^>]+>/.test(raw)) return raw;
    const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        const foundEmail = emailMatch[1];
        const namePart = raw.replace(foundEmail, "").replace(/[<>"']/g, "").trim() || label;
        return `"${namePart}" <${foundEmail}>`;
    }
    return `"${raw.replace(/[<>"']/g, "")}" <${smtpUser}>`;
}

export async function sendVerificationCode({ email, name, code, purpose = "signup" }) {
    const escapedName = escapeHtml(name || "Learner");
    console.log(`[TedbabeLearnHUB Mailer] Verification code (${purpose}) for ${email} (${escapedName}): [ ${code} ]`);
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB", smtpUser);
    const isLogin = purpose === "login";
    const headline = isLogin ? "Confirm a new sign-in" : "Verify your account";
    const intro = isLogin
        ? "We noticed a sign-in attempt from a new device or browser. Enter the 6-digit code below to confirm it's you. This code expires in <strong style=\"color:#ffffff;\">10 minutes</strong>."
        : "Welcome to TedbabeLearnHUB. Enter the 6-digit verification code below to verify your email address. This code expires in <strong style=\"color:#ffffff;\">10 minutes</strong>.";
    const subject = isLogin
        ? `TedbabeLearnHUB — New Sign-in Code: ${code}`
        : `TedbabeLearnHUB — Your Verification Code is ${code}`;

    try {
        await deliverEmail({
            from: fromAddress,
            replyTo: smtpUser,
            to: email,
            subject,
            text: `Hello ${name || "Learner"},\n\nYour TedbabeLearnHUB verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n— TedbabeLearnHUB Team\nhttps://tedbabelearnhub.vercel.app`,
            html: emailWrapper(isLogin ? "New Sign-in Verification" : "Account Verification", `
              <h1 style="font-size:22px;font-weight:800;color:#ffffff;margin-top:0;">${headline}</h1>
              <p style="font-size:14px;color:#e2e8f0;line-height:1.6;">Hello <strong style="color:#ffffff;">${escapedName}</strong>,</p>
              <p style="font-size:14px;color:#94a3b8;line-height:1.6;">${intro}</p>
              <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:28px 20px;text-align:center;margin:28px 0;box-shadow:0 6px 20px rgba(0,0,0,0.35);">
                <div style="font-size:42px;font-weight:900;letter-spacing:16px;color:#818cf8;font-family:'Courier New',Courier,monospace;text-indent:16px;">${code}</div>
              </div>
              <p style="font-size:13px;color:#94a3b8;line-height:1.5;">If you don't see this email in your primary inbox, please check your <strong>Spam / Junk</strong> folder.</p>
              <p style="font-size:12px;color:#64748b;line-height:1.5;margin-top:16px;">If you did not initiate this request, you can safely ignore this email.</p>
            `),
            priority: "high",
            headers: {
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
                "Importance": "high",
                "X-Entity-Ref-ID": `${Date.now()}-${code}`,
            },
        });
        console.log(`[TedbabeLearnHUB Mailer] Verification email successfully delivered to ${email}`);
        return { success: true };
    } catch (error) {
        console.error("[TedbabeLearnHUB Mailer] Verification email delivery failed:", error?.message || error);
        console.log(`[TedbabeLearnHUB Mailer] FALLBACK - Verification code for ${email}: [ ${code} ] (Check console log for verification)`);
        return { success: false, error: error?.message || "Delivery failed" };
    }
}

export async function sendPasswordResetEmail({ email, name, resetUrl, code }) {
    const escapedName = escapeHtml(name);
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB Security", smtpUser);
    try {
        await deliverEmail({
            from: fromAddress,
            replyTo: smtpUser,
            to: email,
            subject: `TedbabeLearnHUB — Password Reset Request (Code: ${code})`,
            text: `Hello ${name}, reset your TedbabeLearnHUB password by visiting: ${resetUrl} or using code ${code}. Valid for 15 minutes.`,
            html: emailWrapper("Password Reset Request", `
              <h1 style="font-size:22px;font-weight:800;color:#ffffff;margin-top:0;">Reset your password</h1>
              <p style="font-size:14px;color:#e2e8f0;line-height:1.6;">Hello <strong style="color:#ffffff;">${escapedName}</strong>,</p>
              <p style="font-size:14px;color:#94a3b8;line-height:1.6;">We received a request to reset the password for your TedbabeLearnHUB account. Click the button below or enter the reset code on the reset page. This link expires in <strong style="color:#ffffff;">15 minutes</strong>.</p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;display:inline-block;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">Reset My Password</a>
              </div>
              <div style="background:#1e293b;border:1px dashed #475569;border-radius:10px;padding:16px;text-align:center;margin:20px 0;">
                <span style="font-size:12px;color:#94a3b8;">Or enter reset code:</span>
                <span style="display:block;font-size:28px;font-weight:900;letter-spacing:8px;color:#818cf8;margin-top:4px;font-family:monospace;">${code}</span>
              </div>
              <p style="font-size:13px;color:#64748b;line-height:1.5;">If you did not request a password reset, please ensure your account remains secure and ignore this email.</p>
            `),
            priority: "high",
            headers: {
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
                "Importance": "high",
            },
        });
        return { success: true };
    } catch (error) {
        console.error("[TedbabeLearnHUB Mailer] Password reset email delivery failed:", error?.message || error);
        console.log(`[TedbabeLearnHUB Mailer] FALLBACK - Password reset for ${email}: URL=${resetUrl}, Code=${code}`);
        return { success: false, error: error?.message || "Delivery failed" };
    }
}

export async function sendSecurityAlertEmail({ email, name, action }) {
    const escapedName = escapeHtml(name);
    const smtpUser = (env.SMTP_USER?.trim() || "debuglife1221@gmail.com").trim();
    const fromAddress = formatFromAddress("TedbabeLearnHUB Security", smtpUser);
    try {
        await deliverEmail({
            from: fromAddress,
            replyTo: smtpUser,
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
