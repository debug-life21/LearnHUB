import mongoose, { Schema } from "mongoose";

const replySchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const discussionSchema = new Schema({
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    isPinned: { type: Boolean, default: false },
    category: {
        type: String,
        enum: ["general", "assignment", "lesson", "question", "announcement"],
        default: "general",
    },
    replies: { type: [replySchema], default: [] },
}, { timestamps: true });

export const DiscussionModel = mongoose.model("Discussion", discussionSchema);
