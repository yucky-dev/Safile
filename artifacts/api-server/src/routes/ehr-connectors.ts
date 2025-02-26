import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ehrConnectorsTable } from "@workspace/db";
import {
  CreateEhrConnectorBody,
  UpdateEhrConnectorBody,
  GetEhrConnectorParams,
  UpdateEhrConnectorParams,
  DeleteEhrConnectorParams,
  TestEhrConnectorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ehr-connectors", async (req, res): Promise<void> => {
  const connectors = await db
    .select()
    .from(ehrConnectorsTable)
    .orderBy(ehrConnectorsTable.createdAt);
  res.json(
    connectors.map((c) => ({
      ...c,
      lastSyncAt: c.lastSyncAt ? c.lastSyncAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/ehr-connectors", async (req, res): Promise<void> => {
  const parsed = CreateEhrConnectorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { apiKey, syncIntervalHours, ...rest } = parsed.data;
  const [connector] = await db
    .insert(ehrConnectorsTable)
    .values({
      ...rest,
      apiKey,
      syncIntervalHours,
      status: "active",
    })
    .returning();
  res.status(201).json({
    ...connector,
    lastSyncAt: connector.lastSyncAt ? connector.lastSyncAt.toISOString() : null,
    createdAt: connector.createdAt.toISOString(),
  });
});

router.get("/ehr-connectors/:id", async (req, res): Promise<void> => {
  const params = GetEhrConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [connector] = await db
    .select()
    .from(ehrConnectorsTable)
    .where(eq(ehrConnectorsTable.id, params.data.id));
  if (!connector) {
    res.status(404).json({ error: "EHR connector not found" });
    return;
  }
  res.json({
    ...connector,
    lastSyncAt: connector.lastSyncAt ? connector.lastSyncAt.toISOString() : null,
    createdAt: connector.createdAt.toISOString(),
  });
});

router.patch("/ehr-connectors/:id", async (req, res): Promise<void> => {
  const params = UpdateEhrConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEhrConnectorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [connector] = await db
    .update(ehrConnectorsTable)
    .set(parsed.data)
    .where(eq(ehrConnectorsTable.id, params.data.id))
    .returning();
  if (!connector) {
    res.status(404).json({ error: "EHR connector not found" });
    return;
  }
  res.json({
    ...connector,
    lastSyncAt: connector.lastSyncAt ? connector.lastSyncAt.toISOString() : null,
    createdAt: connector.createdAt.toISOString(),
  });
});

router.delete("/ehr-connectors/:id", async (req, res): Promise<void> => {
  const params = DeleteEhrConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [connector] = await db
    .delete(ehrConnectorsTable)
    .where(eq(ehrConnectorsTable.id, params.data.id))
    .returning();
  if (!connector) {
    res.status(404).json({ error: "EHR connector not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/ehr-connectors/:id/test", async (req, res): Promise<void> => {
  const params = TestEhrConnectorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [connector] = await db
    .select()
    .from(ehrConnectorsTable)
    .where(eq(ehrConnectorsTable.id, params.data.id));
  if (!connector) {
    res.status(404).json({ error: "EHR connector not found" });
    return;
  }

  const start = Date.now();
  try {
    const response = await fetch(`${connector.apiEndpoint}/auth/test`, {
      method: "GET",
      headers: { Authorization: `Bearer ${connector.apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (response.ok) {
      await db.update(ehrConnectorsTable).set({ status: "active", lastSyncAt: new Date() }).where(eq(ehrConnectorsTable.id, params.data.id));
      res.json({ success: true, message: "Connection successful", latencyMs });
    } else {
      await db.update(ehrConnectorsTable).set({ status: "error" }).where(eq(ehrConnectorsTable.id, params.data.id));
      res.json({ success: false, message: `HTTP ${response.status} from EHR endpoint`, latencyMs });
    }
  } catch {
    const latencyMs = Date.now() - start;
    await db.update(ehrConnectorsTable).set({ status: "error" }).where(eq(ehrConnectorsTable.id, params.data.id));
    res.json({ success: false, message: "Could not reach EHR endpoint", latencyMs: null });
  }
});

export default router;
