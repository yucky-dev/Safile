import { Router, type IRouter } from "express";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import {
  db,
  ehrConnectorsTable,
  backupSnapshotsTable,
  backupRecordsTable,
  encryptionKeysTable,
  indexdNodesTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [connectorStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where status = 'active')::int`,
    })
    .from(ehrConnectorsTable);

  const [backupStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      totalRecords: sql<number>`coalesce(sum(success_records), 0)::int`,
      totalSize: sql<number>`coalesce(sum(total_size_bytes), 0)::int`,
    })
    .from(backupSnapshotsTable);

  const [lastBackup] = await db
    .select({ startedAt: backupSnapshotsTable.startedAt })
    .from(backupSnapshotsTable)
    .orderBy(desc(backupSnapshotsTable.startedAt))
    .limit(1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [failedToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(backupSnapshotsTable)
    .where(
      and(
        gte(backupSnapshotsTable.startedAt, todayStart),
        eq(backupSnapshotsTable.status, "failed")
      )
    );

  const [keyStats] = await db
    .select({ active: sql<number>`count(*) filter (where status = 'active')::int` })
    .from(encryptionKeysTable);

  const [nodeStats] = await db
    .select({ online: sql<number>`count(*) filter (where status = 'online')::int` })
    .from(indexdNodesTable);

  const total = backupStats?.total ?? 0;
  const completed = backupStats?.completed ?? 0;
  const successRate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;

  res.json({
    totalConnectors: connectorStats?.total ?? 0,
    activeConnectors: connectorStats?.active ?? 0,
    totalBackups: total,
    successRate,
    totalRecordsBacked: backupStats?.totalRecords ?? 0,
    totalSizeBytes: backupStats?.totalSize ?? 0,
    lastBackupAt: lastBackup?.startedAt ? lastBackup.startedAt.toISOString() : null,
    failedRecordsToday: failedToday?.count ?? 0,
    activeKeys: keyStats?.active ?? 0,
    onlineNodes: nodeStats?.online ?? 0,
  });
});

router.get("/stats/backup-trend", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', started_at)::text`,
      success: sql<number>`count(*) filter (where status in ('completed', 'partial'))::int`,
      failed: sql<number>`count(*) filter (where status = 'failed')::int`,
    })
    .from(backupSnapshotsTable)
    .where(gte(backupSnapshotsTable.startedAt, thirtyDaysAgo))
    .groupBy(sql`date_trunc('day', started_at)`)
    .orderBy(sql`date_trunc('day', started_at)`);

  res.json(
    rows.map((r) => ({
      date: r.date.split("T")[0].split(" ")[0],
      success: r.success,
      failed: r.failed,
    }))
  );
});

router.get("/stats/ward-coverage", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      ward: backupRecordsTable.ward,
      records: sql<number>`count(*)::int`,
      sizeBytes: sql<number>`coalesce(sum(size_bytes), 0)::int`,
    })
    .from(backupRecordsTable)
    .groupBy(backupRecordsTable.ward)
    .orderBy(sql`count(*) desc`);

  res.json(rows);
});

export default router;
