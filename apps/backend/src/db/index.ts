import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/collab"
);

export const db = drizzle(client, { schema });
