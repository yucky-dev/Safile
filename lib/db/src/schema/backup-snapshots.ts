import { pgTable, serial, text, integer, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const backupSnapshotsTable = pgTable("backup_snapshots", {
  id: serial("id").primaryKey(),
  connectorId: integer("connector_id").notNull(),
  connectorName: text("connector_name").notNull(),
  status: text("status").notNull().default("running"),
  totalRecords: integer("total_records").notNull().default(0),
  successRecords: integer("success_records").notNull().default(0),
  failedRecords: integer("failed_records").notNull().default(0),
  totalSizeBytes: bigint("total_size_bytes", { mode: "number" }).notNull().default(0),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertBackupSnapshotSchema = createInsertSchema(backupSnapshotsTable).omit({ id: true });
export type InsertBackupSnapshot = z.infer<typeof insertBackupSnapshotSchema>;
export type BackupSnapshot = typeof backupSnapshotsTable.$inferSelect;
