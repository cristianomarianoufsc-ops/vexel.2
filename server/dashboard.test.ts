import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Dashboard Stats", () => {
  it("should return dashboard statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("socialMediaCount");
    expect(stats).toHaveProperty("eventsCount");
    expect(stats).toHaveProperty("tasksCompleted");
    expect(stats).toHaveProperty("tasksTotal");
    expect(stats).toHaveProperty("ideasCount");
    expect(typeof stats.socialMediaCount).toBe("number");
    expect(typeof stats.eventsCount).toBe("number");
    expect(typeof stats.tasksCompleted).toBe("number");
    expect(typeof stats.tasksTotal).toBe("number");
    expect(typeof stats.ideasCount).toBe("number");
  });

  it("should return zero counts for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats.socialMediaCount).toBe(0);
    expect(stats.eventsCount).toBe(0);
    expect(stats.tasksCompleted).toBe(0);
    expect(stats.tasksTotal).toBe(0);
    expect(stats.ideasCount).toBe(0);
  });
});

describe("Social Media Router", () => {
  it("should list social media links", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const links = await caller.socialMedia.list();

    expect(Array.isArray(links)).toBe(true);
  });

  it("should create a social media link", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.socialMedia.create({
      platform: "Instagram",
      url: "https://instagram.com/testuser",
      username: "testuser",
    });

    expect(result).toBeDefined();
  });
});

describe("Tasks Router", () => {
  it("should list tasks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.list();

    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should create a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Test Task",
      description: "Test Description",
      status: "pending",
      priority: "high",
    });

    expect(result).toBeDefined();
  });
});

describe("Ideas Router", () => {
  it("should list ideas", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const ideas = await caller.ideas.list();

    expect(Array.isArray(ideas)).toBe(true);
  });

  it("should create an idea", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ideas.create({
      title: "Test Idea",
      description: "Test Description",
      status: "idea",
      priority: "medium",
    });

    expect(result).toBeDefined();
  });
});

describe("Calendar Router", () => {
  it("should list calendar events", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.calendar.list();

    expect(Array.isArray(events)).toBe(true);
  });

  it("should create a calendar event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calendar.create({
      title: "Test Event",
      startDate: new Date(),
      description: "Test Description",
      status: "planned",
    });

    expect(result).toBeDefined();
  });
});
