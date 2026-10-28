import { app } from "./app.js";
import { env } from "./config.js";
import { connectDatabase } from "./db.js";
async function bootstrap() {
    await connectDatabase();
    app.listen(env.PORT, () => {
        console.log(`TedbabeLearnHUB (TLH) API listening on http://localhost:${env.PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start TedbabeLearnHUB (TLH) API", error);
    process.exit(1);
});
