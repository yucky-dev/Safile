import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ehrConnectorsTable = pgTable("ehr_connectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ehrSystem: text("ehr_system").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  apiKey: text("api_key").notNull(),
  syncIntervalHours: integer("sync_interval_hours").notNull().default(1),
  status: text("status").notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEhrConnectorSchema = createInsertSchema(ehrConnectorsTable).omit({ id: true, createdAt: true });
export type InsertEhrConnector = z.infer<typeof insertEhrConnectorSchema>;
export type EhrConnector = typeof ehrConnectorsTable.$inferSelect;
