import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, indexdNodesTable } from "@workspace/db";
import {
  CreateIndexdNodeBody,
  DeleteIndexdNodeParams,
  GetIndexdNodeStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatNode(n: typeof indexdNodesTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/indexd-nodes", async (_req, res): Promise<void> => {
  const nodes = await db
    .select()
    .from(indexdNodesTable)
    .orderBy(indexdNodesTable.createdAt);
  res.json(nodes.map(formatNode));
});

router.post("/indexd-nodes", async (req, res): Promise<void> => {
  const parsed = CreateIndexdNodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [node] = await db
    .insert(indexdNodesTable)
    .values({
      nodeUrl: parsed.data.nodeUrl,
      apiPassword: parsed.data.apiPassword,
      redundancy: parsed.data.redundancy,
      status: "unknown",
    })
    .returning();
  res.status(201).json(formatNode(node));
});

router.delete("/indexd-nodes/:id", async (req, res): Promise<void> => {
  const params = DeleteIndexdNodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [node] = await db
    .delete(indexdNodesTable)
    .where(eq(indexdNodesTable.id, params.data.id))
    .returning();
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/indexd-nodes/:id/status", async (req, res): Promise<void> => {
  const params = GetIndexdNodeStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [node] = await db
    .select()
    .from(indexdNodesTable)
    .where(eq(indexdNodesTable.id, params.data.id));
  if (!node) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  try {
    const start = Date.now();
    const response = await fetch(`${node.nodeUrl}/api/system/status`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`:${node.apiPassword}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    const uptime = Date.now() - start;
    if (response.ok) {
      const data = await response.json() as { version?: string; uptime?: number };
      await db.update(indexdNodesTable).set({ status: "online" }).where(eq(indexdNodesTable.id, params.data.id));
      res.json({ healthy: true, version: data.version ?? null, uptimeSeconds: data.uptime ?? uptime, error: null });
    } else {
      await db.update(indexdNodesTable).set({ status: "offline" }).where(eq(indexdNodesTable.id, params.data.id));
      res.json({ healthy: false, version: null, uptimeSeconds: null, error: `HTTP ${response.status}` });
    }
  } catch (err) {
    await db.update(indexdNodesTable).set({ status: "offline" }).where(eq(indexdNodesTable.id, params.data.id));
    res.json({ healthy: false, version: null, uptimeSeconds: null, error: (err as Error).message });
  }
});

export default router;
