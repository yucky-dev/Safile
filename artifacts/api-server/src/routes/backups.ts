import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, backupSnapshotsTable, backupRecordsTable, ehrConnectorsTable, encryptionKeysTable } from "@workspace/db";
import {
  TriggerBackupBody,
  GetBackupParams,
  ListBackupRecordsParams,
  ListBackupsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatSnapshot(s: typeof backupSnapshotsTable.$inferSelect) {
  return {
    ...s,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  };
}

function formatRecord(r: typeof backupRecordsTable.$inferSelect) {
  return {
    ...r,
    uploadedAt: r.uploadedAt.toISOString(),
  };
}

router.get("/backups", async (req, res): Promise<void> => {
  const params = ListBackupsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let query = db.select().from(backupSnapshotsTable).$dynamic();
  if (params.data.connectorId != null) {
    query = query.where(eq(backupSnapshotsTable.connectorId, params.data.connectorId));
  }
  const limit = params.data.limit ?? 50;
  const snapshots = await query.orderBy(desc(backupSnapshotsTable.startedAt)).limit(limit);
  res.json(snapshots.map(formatSnapshot));
});

router.post("/backups", async (req, res): Promise<void> => {
  const parsed = TriggerBackupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [connector] = await db
    .select()
    .from(ehrConnectorsTable)
    .where(eq(ehrConnectorsTable.id, parsed.data.connectorId));
  if (!connector) {
    res.status(400).json({ error: "EHR connector not found" });
    return;
  }

  const [keyRecord] = await db
    .select()
    .from(encryptionKeysTable)
    .where(eq(encryptionKeysTable.id, parsed.data.keyId));
  if (!keyRecord) {
    res.status(400).json({ error: "Encryption key not found" });
    return;
  }

  const [snapshot] = await db
    .insert(backupSnapshotsTable)
    .values({
      connectorId: connector.id,
      connectorName: connector.name,
      status: "running",
      totalRecords: 0,
      successRecords: 0,
      failedRecords: 0,
      totalSizeBytes: 0,
    })
    .returning();

  // Simulate async backup completion in background
  setTimeout(async () => {
    try {
      const wards = ["General", "ICU", "Paediatrics", "Maternity", "Surgical", "Emergency"];
      const recordCount = Math.floor(Math.random() * 40) + 10;
      const failedCount = Math.floor(Math.random() * 3);
      const successCount = recordCount - failedCount;
      let totalSize = 0;
      const now = new Date();

      const records = Array.from({ length: successCount }, (_, i) => {
        const size = Math.floor(Math.random() * 50000) + 5000;
        totalSize += size;
        return {
          snapshotId: snapshot.id,
          patientId: `PAT-${String(snapshot.id).padStart(4, "0")}-${String(i + 1).padStart(3, "0")}`,
          patientName: `Patient ${i + 1}`,
          ward: wards[Math.floor(Math.random() * wards.length)],
          indexdHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          localHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          sizeBytes: size,
          verified: Math.random() > 0.1,
          uploadedAt: now,
        };
      });

      if (records.length > 0) {
        await db.insert(backupRecordsTable).values(records);
      }

      await db.update(backupSnapshotsTable).set({
        status: failedCount > 0 ? "partial" : "completed",
        totalRecords: recordCount,
        successRecords: successCount,
        failedRecords: failedCount,
        totalSizeBytes: totalSize,
        durationMs: Math.floor(Math.random() * 30000) + 5000,
        completedAt: new Date(),
      }).where(eq(backupSnapshotsTable.id, snapshot.id));
    } catch {
      await db.update(backupSnapshotsTable).set({
        status: "failed",
        completedAt: new Date(),
      }).where(eq(backupSnapshotsTable.id, snapshot.id));
    }
  }, 3000 + Math.random() * 7000);

  res.status(202).json(formatSnapshot(snapshot));
});

router.get("/backups/:id", async (req, res): Promise<void> => {
  const params = GetBackupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [snapshot] = await db
    .select()
    .from(backupSnapshotsTable)
    .where(eq(backupSnapshotsTable.id, params.data.id));
  if (!snapshot) {
    res.status(404).json({ error: "Backup snapshot not found" });
    return;
  }
  res.json(formatSnapshot(snapshot));
});

router.get("/backups/:id/records", async (req, res): Promise<void> => {
  const params = ListBackupRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [snapshot] = await db
    .select()
    .from(backupSnapshotsTable)
    .where(eq(backupSnapshotsTable.id, params.data.id));
  if (!snapshot) {
    res.status(404).json({ error: "Backup snapshot not found" });
    return;
  }
  const records = await db
    .select()
    .from(backupRecordsTable)
    .where(eq(backupRecordsTable.snapshotId, params.data.id))
    .orderBy(backupRecordsTable.uploadedAt);
  res.json(records.map(formatRecord));
});

export default router;
