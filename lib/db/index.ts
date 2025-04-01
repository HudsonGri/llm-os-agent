import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/lib/env.mjs";
import * as schema from "./schema/index";

// For connection to database
const client = postgres(env.DATABASE_URL);

// For query building
export const db = drizzle(client, { schema });

// Re-export schema
export * from "./schema/index";

