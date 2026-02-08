import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, socialMediaLinks, calendarEvents, contentIdeas, assets, tasks, apiKeys, templates, loreNotes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Social Media Links
export async function getSocialMediaLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialMediaLinks).where(eq(socialMediaLinks.userId, userId)).orderBy(desc(socialMediaLinks.createdAt));
}

export async function createSocialMediaLink(userId: number, platform: string, url: string, username?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(socialMediaLinks).values({ userId, platform, url, username });
}

export async function deleteSocialMediaLink(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(socialMediaLinks).where(and(eq(socialMediaLinks.id, id), eq(socialMediaLinks.userId, userId)));
}

// Calendar Events
export async function getCalendarEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.startDate));
}

export async function createCalendarEvent(userId: number, title: string, startDate: Date, description?: string, endDate?: Date, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(calendarEvents).values({ userId, title, startDate, description, endDate, status: status as any });
}

// Content Ideas
export async function getContentIdeas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentIdeas).where(eq(contentIdeas.userId, userId)).orderBy(desc(contentIdeas.createdAt));
}

export async function createContentIdea(userId: number, title: string, description?: string, category?: string, status?: string, priority?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contentIdeas).values({ userId, title, description, category, status: status as any, priority: priority as any });
}

// Assets
export async function getAssets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}

export async function createAsset(userId: number, name: string, fileUrl: string, fileType?: string, fileSize?: number, category?: string, tags?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(assets).values({ userId, name, fileUrl, fileType, fileSize, category, tags });
}

// Tasks
export async function getTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function createTask(userId: number, title: string, description?: string, status?: string, dueDate?: Date, priority?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(tasks).values({ userId, title, description, status: status as any, dueDate, priority: priority as any });
}

export async function updateTask(id: number, userId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// API Keys
export async function getApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(userId: number, name: string, keyHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(apiKeys).values({ userId, name, keyHash });
}

// Templates
export async function getTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.createdAt));
}

// Lore Notes
export async function getLoreNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loreNotes).where(eq(loreNotes.userId, userId)).orderBy(desc(loreNotes.createdAt));
}

export async function createLoreNote(userId: number, title: string, content?: string, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(loreNotes).values({ userId, title, content, category });
}
