import { connectDatabase } from "./db.js";
import mongoose from "mongoose";
import { LearningResourceModel } from "./models/LearningResource.js";
import { TeacherApplicationModel } from "./models/TeacherApplication.js";
import { migrateLocalFileToR2 } from "./lib/storage.js";

await connectDatabase();

try {
    const resources = await LearningResourceModel.find({
        storedKey: { $ne: "" },
        storageProvider: { $ne: "r2" },
    }).select("_id storedKey mimeType").lean();
    const applications = await TeacherApplicationModel.find({
        $or: [
            { "documents.cv.key": { $ne: "" }, "documents.cv.storageProvider": { $ne: "r2" } },
            { "documents.certificates": { $elemMatch: { key: { $ne: "" }, storageProvider: { $ne: "r2" } } } },
        ],
    });
    let migrated = 0;
    const total = resources.length +
        applications.reduce((count, application) => count +
            (application.documents?.cv?.key && application.documents.cv.storageProvider !== "r2" ? 1 : 0) +
            (application.documents?.certificates || []).filter((document) => document.key && document.storageProvider !== "r2").length, 0);

    for (const resource of resources) {
        await migrateLocalFileToR2(resource.storedKey, resource.mimeType);
        await LearningResourceModel.updateOne({ _id: resource._id }, { $set: { storageProvider: "r2" } });
        migrated += 1;
        console.log(`Migrated ${migrated}/${total} learning resources and application documents.`);
    }

    for (const application of applications) {
        let changed = false;
        const documents = application.documents;
        if (documents?.cv?.key && documents.cv.storageProvider !== "r2") {
            await migrateLocalFileToR2(documents.cv.key, documents.cv.mimeType);
            documents.cv.storageProvider = "r2";
            migrated += 1;
            changed = true;
            console.log(`Migrated ${migrated}/${total} learning resources and application documents.`);
        }
        for (const certificate of documents?.certificates || []) {
            if (!certificate.key || certificate.storageProvider === "r2") continue;
            await migrateLocalFileToR2(certificate.key, certificate.mimeType);
            certificate.storageProvider = "r2";
            migrated += 1;
            changed = true;
            console.log(`Migrated ${migrated}/${total} learning resources and application documents.`);
        }
        if (changed) await application.save();
    }

    console.log(`Migration complete. ${migrated} files now use R2. Local originals were retained.`);
} finally {
    await mongoose.connection.close();
}
