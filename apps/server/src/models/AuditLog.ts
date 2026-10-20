import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: String, required: true, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
