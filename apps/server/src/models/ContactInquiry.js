import mongoose, { Schema } from "mongoose";
const contactInquirySchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ["new", "in_progress", "closed"],
        default: "new",
        index: true,
    },
}, { timestamps: true });
export const ContactInquiryModel = mongoose.model("ContactInquiry", contactInquirySchema);
