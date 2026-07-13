import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // "session" is created at runtime by connect-pg-simple and is not part of
  // the Drizzle schema — exclude it so push never proposes dropping it.
  tablesFilter: ["!session"],
});
