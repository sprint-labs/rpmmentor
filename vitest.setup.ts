import { config } from "dotenv";

// Load .env then .env.local (local overrides for test credentials).
config({ path: ".env" });
config({ path: ".env.local", override: true });
