import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  runMigration: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      try {
        await db.execute(sql`
          INSERT INTO socialMediaLinks (userId, platform, url, username, createdAt, updatedAt)
          VALUES (1, 'YouTube', 'https://www.youtube.com/@bandavexel', 'bandavexel', NOW(), NOW())
          ON DUPLICATE KEY UPDATE updatedAt = NOW();
        `);
        return { success: true, message: "Migration executed successfully" };
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    }),
});
