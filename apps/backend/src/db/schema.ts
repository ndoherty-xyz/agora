import { pgTable, text, timestamp, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const document = pgTable("document", {
  id: text("id").primaryKey().default("main"),
  content: bytea("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
