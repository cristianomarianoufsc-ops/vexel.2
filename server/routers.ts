import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Social Media Links
  socialMedia: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getSocialMediaLinks(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        platform: z.string(),
        url: z.string().url(),
        username: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createSocialMediaLink(ctx.user.id, input.platform, input.url, input.username)
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteSocialMediaLink(input.id, ctx.user.id)
      ),
  }),

  // Calendar Events
  calendar: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCalendarEvents(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        startDate: z.date(),
        description: z.string().optional(),
        endDate: z.date().optional(),
        status: z.enum(["planned", "scheduled", "completed", "cancelled"]).optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createCalendarEvent(
          ctx.user.id,
          input.title,
          input.startDate,
          input.description,
          input.endDate,
          input.status
        )
      ),
  }),

  // Content Ideas
  ideas: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getContentIdeas(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["idea", "in_progress", "completed", "archived"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createContentIdea(
          ctx.user.id,
          input.title,
          input.description,
          input.category,
          input.status,
          input.priority
        )
      ),
  }),

  // Assets
  assets: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAssets(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        fileUrl: z.string().url(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createAsset(
          ctx.user.id,
          input.name,
          input.fileUrl,
          input.fileType,
          input.fileSize,
          input.category,
          input.tags
        )
      ),
  }),

  // Tasks
  tasks: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getTasks(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
        dueDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createTask(
          ctx.user.id,
          input.title,
          input.description,
          input.status,
          input.dueDate,
          input.priority
        )
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.updateTask(input.id, ctx.user.id, { status: input.status })
      ),
  }),

  // API Keys
  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getApiKeys(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        keyHash: z.string(),
      }))
      .mutation(({ ctx, input }) =>
        db.createApiKey(ctx.user.id, input.name, input.keyHash)
      ),
  }),

  // Templates
  templates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getTemplates(ctx.user.id)
    ),
  }),

  // Lore Notes
  lore: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getLoreNotes(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createLoreNote(ctx.user.id, input.title, input.content, input.category)
      ),
  }),

  // Dashboard Stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const [socialLinks, events, ideas, tasks] = await Promise.all([
        db.getSocialMediaLinks(ctx.user.id),
        db.getCalendarEvents(ctx.user.id),
        db.getContentIdeas(ctx.user.id),
        db.getTasks(ctx.user.id),
      ]);

      const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
      const totalTasks = tasks.length;

      return {
        socialMediaCount: socialLinks.length,
        eventsCount: events.length,
        tasksCompleted: completedTasks,
        tasksTotal: totalTasks,
        ideasCount: ideas.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
