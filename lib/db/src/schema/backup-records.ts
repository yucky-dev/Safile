import { pgTable, serial, text, integer, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const backupRecordsTable = pgTable("backup_records", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull(),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  ward: text("ward").notNull(),
  indexdHash: text("indexd_hash").notNull(),
  localHash: text("local_hash").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertBackupRecordSchema = createInsertSchema(backupRecordsTable).omit({ id: true });
export type InsertBackupRecord = z.infer<typeof insertBackupRecordSchema>;
export type BackupRecord = typeof backupRecordsTable.$inferSelect;
