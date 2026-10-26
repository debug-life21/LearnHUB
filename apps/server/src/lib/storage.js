import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const storageProvider = env.STORAGE_PROVIDER === "r2" ? "r2" : "local_disk";
const r2Client = env.R2_ACCOUNT_ID && env.R2_BUCKET && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    })
    : null;

function requireR2Client() {
    if (!r2Client) {
        throw new Error("R2 credentials are required to read or write this R2 file.");
    }
    return r2Client;
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
    ".jsx",
    ".ts",
    ".php",
    ".py",
    ".rb",
    ".html",
    ".svg",
]);
export function validateFileType(filename, mimeType) {
    const ext = path.extname(filename).toLowerCase();
    if (DISALLOWED_EXTENSIONS.has(ext)) {
        return false;
    }
    return ALLOWED_MIME_TYPES.has(mimeType);
}
export async function saveFile(buffer, originalFilename, mimeType = "application/octet-stream") {
    const ext = path.extname(originalFilename).toLowerCase();
    const safeHash = crypto.randomBytes(16).toString("hex");
    const key = `${safeHash}${ext}`;
    if (storageProvider === "r2") {
        await requireR2Client().send(new PutObjectCommand({
            Bucket: env.R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));
    } else {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(path.join(UPLOAD_DIR, key), buffer, { flag: "wx" });
    }
    return {
        key,
        size: buffer.length,
        storageProvider,
    };
}

function getLocalFilePath(key) {
    const sanitizedKey = path.basename(key);
    const filePath = path.join(UPLOAD_DIR, sanitizedKey);
    return filePath;
}

export async function getStoredFileStream(key, provider = "local_disk", rangeHeader = "") {
    if (provider === "r2") {
        try {
            const response = await requireR2Client().send(new GetObjectCommand({
                Bucket: env.R2_BUCKET,
                Key: key,
                ...(rangeHeader ? { Range: rangeHeader } : {}),
            }));
            return response.Body ? {
                body: response.Body,
                contentLength: response.ContentLength,
                contentRange: response.ContentRange,
                partial: response.ContentRange !== undefined,
            } : null;
        } catch (error) {
            if (error?.name === "NoSuchKey" || error?.name === "NotFound") return null;
            throw error;
        }
    }
    const filePath = getLocalFilePath(key);
    try {
        const { size } = await fs.stat(filePath);
        if (!rangeHeader) {
            return { body: createReadStream(filePath), contentLength: size, partial: false };
        }
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
        if (!match || (!match[1] && !match[2])) return { invalidRange: true, size };
        const start = match[1] ? Number(match[1]) : Math.max(size - Number(match[2]), 0);
        const end = match[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
            return { invalidRange: true, size };
        }
        return {
            body: createReadStream(filePath, { start, end }),
            contentLength: end - start + 1,
            contentRange: `bytes ${start}-${end}/${size}`,
            partial: true,
        };
    } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
    }
}

export async function deleteStoredFile(key, provider = "local_disk") {
    if (provider === "r2") {
        await requireR2Client().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
        return;
    }
    try {
        await fs.unlink(getLocalFilePath(key));
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
    }
}

export async function migrateLocalFileToR2(key, mimeType = "application/octet-stream") {
    if (storageProvider !== "r2") {
        throw new Error("Set STORAGE_PROVIDER=r2 before migrating local uploads.");
    }
    if (!key || path.basename(key) !== key) {
        throw new Error("Invalid local storage key.");
    }
    const buffer = await fs.readFile(getLocalFilePath(key));
    await requireR2Client().send(new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    }));
}
