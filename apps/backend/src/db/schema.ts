import { boolean } from "drizzle-orm/pg-core";
import { date } from "drizzle-orm/pg-core";
import {
  pgTable,
  text,
  timestamp,
  customType,
  uuid,
} from "drizzle-orm/pg-core";

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

export const xSession = pgTable("x_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  xId: text("x_id"),
  xHandle: text("x_handle"),
  xAvatarUrl: text("x_avatar_url"),
  state: text("state"),
  codeVerifier: text("code_verifier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const moderatedImage = pgTable("moderated_images", {
  url: text("url").primaryKey(),
  flagged: boolean("flagged").notNull(),
  moderatedAt: timestamp("moderated_at").notNull().defaultNow(),
});
