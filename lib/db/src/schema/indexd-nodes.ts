import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const indexdNodesTable = pgTable("indexd_nodes", {
  id: serial("id").primaryKey(),
  nodeUrl: text("node_url").notNull(),
  apiPassword: text("api_password").notNull(),
  redundancy: integer("redundancy").notNull().default(3),
  status: text("status").notNull().default("unknown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIndexdNodeSchema = createInsertSchema(indexdNodesTable).omit({ id: true, createdAt: true });
export type InsertIndexdNode = z.infer<typeof insertIndexdNodeSchema>;
export type IndexdNode = typeof indexdNodesTable.$inferSelect;
