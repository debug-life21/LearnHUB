import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { seedLearningCatalog } from "./catalog.js";

async function seedCatalog() {
    await connectDatabase();
    try {
        await seedLearningCatalog();
    } finally {
        await mongoose.disconnect();
    }
}

seedCatalog().catch((error) => {
    console.error("Catalog seeding failed:", error);
    process.exitCode = 1;
});
