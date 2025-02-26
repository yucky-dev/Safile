import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, encryptionKeysTable } from "@workspace/db";
import {
  CreateKeyBody,
  RotateKeyParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatKey(k: typeof encryptionKeysTable.$inferSelect) {
  return {
    ...k,
    createdAt: k.createdAt.toISOString(),
    rotatedAt: k.rotatedAt ? k.rotatedAt.toISOString() : null,
  };
}

router.get("/keys", async (_req, res): Promise<void> => {
  const keys = await db
    .select()
    .from(encryptionKeysTable)
    .orderBy(encryptionKeysTable.createdAt);
  res.json(keys.map(formatKey));
});

router.post("/keys", async (req, res): Promise<void> => {
  const parsed = CreateKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const keyId = `mkey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [key] = await db
    .insert(encryptionKeysTable)
    .values({
      keyId,
      algorithm: parsed.data.algorithm || "AES-256-GCM",
      status: "active",
      connectorId: parsed.data.connectorId ?? null,
    })
    .returning();
  res.status(201).json(formatKey(key));
});

router.post("/keys/:id/rotate", async (req, res): Promise<void> => {
  const params = RotateKeyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(encryptionKeysTable)
    .where(eq(encryptionKeysTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Key not found" });
    return;
  }

  await db
    .update(encryptionKeysTable)
    .set({ status: "rotated", rotatedAt: new Date() })
    .where(eq(encryptionKeysTable.id, params.data.id));

  const newKeyId = `mkey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [newKey] = await db
    .insert(encryptionKeysTable)
    .values({
      keyId: newKeyId,
      algorithm: existing.algorithm,
      status: "active",
      connectorId: existing.connectorId,
    })
    .returning();

  res.json(formatKey(newKey));
});

export default router;
