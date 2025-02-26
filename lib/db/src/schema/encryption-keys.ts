import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const encryptionKeysTable = pgTable("encryption_keys", {
  id: serial("id").primaryKey(),
  keyId: text("key_id").notNull().unique(),
  algorithm: text("algorithm").notNull().default("AES-256-GCM"),
  status: text("status").notNull().default("active"),
  connectorId: integer("connector_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  rotatedAt: timestamp("rotated_at"),
});

export const insertEncryptionKeySchema = createInsertSchema(encryptionKeysTable).omit({ id: true, createdAt: true });
export type InsertEncryptionKey = z.infer<typeof insertEncryptionKeySchema>;
export type EncryptionKey = typeof encryptionKeysTable.$inferSelect;
