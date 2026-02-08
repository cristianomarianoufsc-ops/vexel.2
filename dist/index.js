// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var socialMediaLinks = mysqlTable("socialMediaLinks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  url: text("url").notNull(),
  username: varchar("username", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["planned", "scheduled", "completed", "cancelled"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var contentIdeas = mysqlTable("contentIdeas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  status: mysqlEnum("status", ["idea", "in_progress", "completed", "archived"]).default("idea").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }),
  fileSize: int("fileSize"),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: text("keyHash").notNull(),
  lastUsed: timestamp("lastUsed"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var loreNotes = mysqlTable("loreNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://auth.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getSocialMediaLinks(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialMediaLinks).where(eq(socialMediaLinks.userId, userId)).orderBy(desc(socialMediaLinks.createdAt));
}
async function createSocialMediaLink(userId, platform, url, username) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(socialMediaLinks).values({ userId, platform, url, username });
}
async function deleteSocialMediaLink(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(socialMediaLinks).where(and(eq(socialMediaLinks.id, id), eq(socialMediaLinks.userId, userId)));
}
async function getCalendarEvents(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.startDate));
}
async function createCalendarEvent(userId, title, startDate, description, endDate, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(calendarEvents).values({ userId, title, startDate, description, endDate, status });
}
async function getContentIdeas(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentIdeas).where(eq(contentIdeas.userId, userId)).orderBy(desc(contentIdeas.createdAt));
}
async function createContentIdea(userId, title, description, category, status, priority) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contentIdeas).values({ userId, title, description, category, status, priority });
}
async function getAssets(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}
async function createAsset(userId, name, fileUrl, fileType, fileSize, category, tags) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(assets).values({ userId, name, fileUrl, fileType, fileSize, category, tags });
}
async function getTasks(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}
async function createTask(userId, title, description, status, dueDate, priority) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(tasks).values({ userId, title, description, status, dueDate, priority });
}
async function updateTask(id, userId, title, description, status, priority) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates = {};
  if (title !== void 0) updates.title = title;
  if (description !== void 0) updates.description = description;
  if (status !== void 0) updates.status = status;
  if (priority !== void 0) updates.priority = priority;
  return db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}
async function getApiKeys(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}
async function createApiKey(userId, name, keyHash) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(apiKeys).values({ userId, name, keyHash });
}
async function getTemplates(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.createdAt));
}
async function getLoreNotes(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loreNotes).where(eq(loreNotes.userId, userId)).orderBy(desc(loreNotes.createdAt));
}
async function createLoreNote(userId, title, content, category) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(loreNotes).values({ userId, title, content, category });
}
async function updateSocialMediaLink(id, userId, platform, url, username) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(socialMediaLinks).set({ platform, url, username }).where(and(eq(socialMediaLinks.id, id), eq(socialMediaLinks.userId, userId)));
}
async function updateCalendarEvent(id, userId, title, startDate, description, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(calendarEvents).set({ title, startDate, description, status }).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}
async function deleteCalendarEvent(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}
async function updateContentIdea(id, userId, title, description, status, priority) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contentIdeas).set({ title, description, status, priority }).where(and(eq(contentIdeas.id, id), eq(contentIdeas.userId, userId)));
}
async function deleteContentIdea(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(contentIdeas).where(and(eq(contentIdeas.id, id), eq(contentIdeas.userId, userId)));
}
async function deleteAsset(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, userId)));
}
async function deleteTask(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}
async function deleteApiKey(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}
async function createTemplate(userId, name, content) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(templates).values({ userId, name, content });
}
async function deleteTemplate(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
}
async function updateLoreNote(id, userId, title, content) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(loreNotes).set({ title, content }).where(and(eq(loreNotes.id, id), eq(loreNotes.userId, userId)));
}
async function deleteLoreNote(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(loreNotes).where(and(eq(loreNotes.id, id), eq(loreNotes.userId, userId)));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
import { sql } from "drizzle-orm";
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  }),
  runMigration: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    try {
      await db.execute(sql`
          INSERT INTO socialMediaLinks (userId, platform, url, username, createdAt, updatedAt)
          VALUES (1, 'YouTube', 'https://www.youtube.com/@bandavexel', 'bandavexel', NOW(), NOW())
          ON DUPLICATE KEY UPDATE updatedAt = NOW();
        `);
      return { success: true, message: "Migration executed successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  })
});

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Social Media Links
  socialMedia: router({
    list: protectedProcedure.query(
      ({ ctx }) => getSocialMediaLinks(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      platform: z2.string(),
      url: z2.string().url(),
      username: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => createSocialMediaLink(ctx.user.id, input.platform, input.url, input.username)
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      platform: z2.string(),
      url: z2.string().url(),
      username: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => updateSocialMediaLink(input.id, ctx.user.id, input.platform, input.url, input.username)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteSocialMediaLink(input.id, ctx.user.id)
    )
  }),
  // Calendar Events
  calendar: router({
    list: protectedProcedure.query(
      ({ ctx }) => getCalendarEvents(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      startDate: z2.date(),
      description: z2.string().optional(),
      endDate: z2.date().optional(),
      status: z2.enum(["planned", "scheduled", "completed", "cancelled"]).optional()
    })).mutation(
      ({ ctx, input }) => createCalendarEvent(
        ctx.user.id,
        input.title,
        input.startDate,
        input.description,
        input.endDate,
        input.status
      )
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string(),
      startDate: z2.date(),
      description: z2.string().optional(),
      status: z2.enum(["planned", "scheduled", "completed", "cancelled"]).optional()
    })).mutation(
      ({ ctx, input }) => updateCalendarEvent(input.id, ctx.user.id, input.title, input.startDate, input.description, input.status)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteCalendarEvent(input.id, ctx.user.id)
    )
  }),
  // Content Ideas
  ideas: router({
    list: protectedProcedure.query(
      ({ ctx }) => getContentIdeas(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      description: z2.string().optional(),
      category: z2.string().optional(),
      status: z2.enum(["idea", "in_progress", "completed", "archived"]).optional(),
      priority: z2.enum(["low", "medium", "high"]).optional()
    })).mutation(
      ({ ctx, input }) => createContentIdea(
        ctx.user.id,
        input.title,
        input.description,
        input.category,
        input.status,
        input.priority
      )
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string(),
      description: z2.string().optional(),
      status: z2.enum(["idea", "in_progress", "completed", "archived"]).optional(),
      priority: z2.enum(["low", "medium", "high"]).optional()
    })).mutation(
      ({ ctx, input }) => updateContentIdea(input.id, ctx.user.id, input.title, input.description, input.status, input.priority)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteContentIdea(input.id, ctx.user.id)
    )
  }),
  // Assets
  assets: router({
    list: protectedProcedure.query(
      ({ ctx }) => getAssets(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      filename: z2.string(),
      fileUrl: z2.string().url(),
      fileType: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => createAsset(
        ctx.user.id,
        input.filename,
        input.fileUrl,
        input.fileType
      )
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteAsset(input.id, ctx.user.id)
    )
  }),
  // Tasks
  tasks: router({
    list: protectedProcedure.query(
      ({ ctx }) => getTasks(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      description: z2.string().optional(),
      status: z2.enum(["pending", "in_progress", "completed"]).optional(),
      dueDate: z2.date().optional(),
      priority: z2.enum(["low", "medium", "high"]).optional()
    })).mutation(
      ({ ctx, input }) => createTask(
        ctx.user.id,
        input.title,
        input.description,
        input.status,
        input.dueDate,
        input.priority
      )
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string(),
      description: z2.string().optional(),
      status: z2.enum(["pending", "in_progress", "completed"]).optional(),
      priority: z2.enum(["low", "medium", "high"]).optional()
    })).mutation(
      ({ ctx, input }) => updateTask(input.id, ctx.user.id, input.title, input.description, input.status, input.priority)
    ),
    toggle: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["pending", "in_progress", "completed"])
    })).mutation(
      ({ ctx, input }) => updateTask(input.id, ctx.user.id, void 0, void 0, input.status)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteTask(input.id, ctx.user.id)
    )
  }),
  // API Keys
  apiKeys: router({
    list: protectedProcedure.query(
      ({ ctx }) => getApiKeys(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      name: z2.string(),
      key: z2.string()
    })).mutation(
      ({ ctx, input }) => createApiKey(ctx.user.id, input.name, input.key)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteApiKey(input.id, ctx.user.id)
    )
  }),
  // Templates
  templates: router({
    list: protectedProcedure.query(
      ({ ctx }) => getTemplates(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      name: z2.string(),
      content: z2.string()
    })).mutation(
      ({ ctx, input }) => createTemplate(ctx.user.id, input.name, input.content)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteTemplate(input.id, ctx.user.id)
    )
  }),
  // Lore Notes
  lore: router({
    list: protectedProcedure.query(
      ({ ctx }) => getLoreNotes(ctx.user.id)
    ),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      content: z2.string().optional(),
      category: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => createLoreNote(ctx.user.id, input.title, input.content, input.category)
    ),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string(),
      content: z2.string().optional()
    })).mutation(
      ({ ctx, input }) => updateLoreNote(input.id, ctx.user.id, input.title, input.content)
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(
      ({ ctx, input }) => deleteLoreNote(input.id, ctx.user.id)
    )
  }),
  // Dashboard Stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const [socialLinks, events, ideas, tasks2] = await Promise.all([
        getSocialMediaLinks(ctx.user.id),
        getCalendarEvents(ctx.user.id),
        getContentIdeas(ctx.user.id),
        getTasks(ctx.user.id)
      ]);
      const completedTasks = tasks2.filter((t2) => t2.status === "completed").length;
      const totalTasks = tasks2.length;
      return {
        socialMediaCount: socialLinks.length,
        eventsCount: events.length,
        tasksCompleted: completedTasks,
        tasksTotal: totalTasks,
        ideasCount: ideas.length
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
