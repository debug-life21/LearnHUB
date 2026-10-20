import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "text/plain",
]);

export const DISALLOWED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".sh",
  ".bin",
  ".cmd",
  ".js",
  ".ts",
  ".php",
  ".py",
  ".rb",
  ".html",
  ".svg",
]);

export function validateFileType(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    return false;
  }
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function saveLocalFile(
  buffer: Buffer,
  originalFilename: string,
): { key: string; filePath: string; size: number } {
  const ext = path.extname(originalFilename).toLowerCase();
  const safeHash = crypto.randomBytes(16).toString("hex");
  const key = `${safeHash}${ext}`;
  const filePath = path.join(UPLOAD_DIR, key);

  fs.writeFileSync(filePath, buffer);

  return {
    key,
    filePath,
    size: buffer.length,
  };
}

export function getLocalFilePath(key: string): string | null {
  // Prevent directory traversal
  const sanitizedKey = path.basename(key);
  const filePath = path.join(UPLOAD_DIR, sanitizedKey);

  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
