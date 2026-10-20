import mongoose, { Schema } from "mongoose";

const platformSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export const PlatformSettingModel = mongoose.model("PlatformSetting", platformSettingSchema);
