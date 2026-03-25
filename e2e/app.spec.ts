import { test, expect } from "@playwright/test";

const SESSION_ID = "0e9113c6-b9a1-4798-aec9-433173722aa0";

test.describe("Dashboard / Timeline page", () => {
	test("loads with correct title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/daemon/i);
	});

	test("sidebar renders with navigation links", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("text=daemon").first()).toBeVisible();
		await expect(page.getByRole("link", { name: /Timeline/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /Sessions/i }).first()).toBeVisible();
		await expect(page.getByRole("link", { name: /Setup/i })).toBeVisible();
	});

	test("Timeline page renders interactive content", async ({ page }) => {
		await page.goto("/");
		await page.waitForTimeout(3000);
		await expect(page.locator("button").first()).toBeVisible({ timeout: 15000 });
	});
});

test.describe("Sessions page", () => {
	test("navigates to sessions page", async ({ page }) => {
		await page.goto("/sessions");
		await expect(page.locator("h1, h2, h3").first()).toBeVisible({ timeout: 15000 });
	});

	test("sessions page shows session cards or empty state", async ({ page }) => {
		await page.goto("/sessions");
		await page.waitForTimeout(3000);
		const hasCards = await page.locator('a[href*="/session/"]').first().isVisible().catch(() => false);
		const hasContent = await page.locator("main").first().isVisible().catch(() => false);
		expect(hasCards || hasContent).toBe(true);
	});
});

test.describe("Setup page", () => {
	test("navigates to setup page", async ({ page }) => {
		await page.goto("/setup");
		await expect(page.locator("h1, h2, h3").first()).toBeVisible({ timeout: 15000 });
	});

	test("setup page has instructional content", async ({ page }) => {
		await page.goto("/setup");
		const hasCode = await page.locator("code, pre").first().isVisible({ timeout: 10000 }).catch(() => false);
		const hasSteps = await page.locator("li, ol").first().isVisible().catch(() => false);
		expect(hasCode || hasSteps).toBe(true);
	});
});

test.describe("Session detail page", () => {
	test("loads session detail with all 5 tabs", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		await expect(page.getByRole("button", { name: "Overview" })).toBeVisible({ timeout: 15000 });
		await expect(page.getByRole("button", { name: "Timeline" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Failures" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Improvements" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Console" })).toBeVisible();
	});

	test("session ID appears on the page", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		await page.waitForTimeout(2000);
		const pageText = await page.textContent("body");
		expect(pageText).toContain(SESSION_ID.slice(0, 8));
	});

	test("breadcrumbs have Dashboard and Sessions links", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible({ timeout: 15000 });
		await expect(page.getByRole("link", { name: "Sessions", exact: true })).toBeVisible();
	});

	test("Overview tab is active by default", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		const overviewBtn = page.getByRole("button", { name: "Overview" });
		await expect(overviewBtn).toBeVisible({ timeout: 15000 });
		await expect(overviewBtn).toHaveClass(/accent|ember|font-medium/);
	});

	test("clicking each tab activates it", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		for (const tabName of ["Timeline", "Failures", "Improvements", "Console"]) {
			const tab = page.getByRole("button", { name: tabName });
			await expect(tab).toBeVisible({ timeout: 15000 });
			await tab.click();
			await expect(tab).toHaveClass(/accent|ember|font-medium/);
		}
	});

	test("Analyze button is visible", async ({ page }) => {
		await page.goto(`/session/${SESSION_ID}`);
		const analyzeButton = page.locator("button", { hasText: /Analyze/ });
		await expect(analyzeButton).toBeVisible({ timeout: 15000 });
	});
});

test.describe("Sidebar navigation", () => {
	test("Sessions nav link works", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("link", { name: /Sessions/i }).first().click();
		await expect(page).toHaveURL(/\/sessions/);
	});

	test("Setup nav link works", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("link", { name: /Setup/i }).click();
		await expect(page).toHaveURL(/\/setup/);
	});

	test("Timeline nav link goes home", async ({ page }) => {
		await page.goto("/sessions");
		await page.getByRole("link", { name: /Timeline/i }).click();
		await expect(page).toHaveURL(/\/$/);
	});
});

test.describe("Failures page redirect", () => {
	test("/failures redirects to /improvements", async ({ page }) => {
		await page.goto("/failures");
		await expect(page).toHaveURL(/\/improvements/);
	});
});

test.describe("API endpoints via Playwright", () => {
	test("schema endpoint returns valid JSON schema", async ({ request }) => {
		const res = await request.get("/api/agent/schemas/TimelinePlan");
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.title).toBe("TimelinePlan");
		expect(data.type).toBe("object");
	});

	test("schema endpoint 404 for invalid type", async ({ request }) => {
		const res = await request.get("/api/agent/schemas/InvalidType");
		expect(res.status()).toBe(404);
	});

	test("agent manifest returns endpoints", async ({ request }) => {
		const res = await request.get("/api/agent");
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.endpoints).toBeDefined();
	});

	test("groups endpoint returns array", async ({ request }) => {
		const res = await request.get("/api/groups");
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data.groups)).toBe(true);
	});

	test("sessions endpoint returns sessions", async ({ request }) => {
		const res = await request.get("/api/sessions?limit=3");
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data.sessions)).toBe(true);
	});

	test("events endpoint returns events", async ({ request }) => {
		const res = await request.get(`/api/events?sessionId=${SESSION_ID}&limit=5`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data.events)).toBe(true);
	});

	test("analysis endpoint returns analyses", async ({ request }) => {
		const res = await request.get(`/api/analysis?sessionId=${SESSION_ID}`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(Array.isArray(data.analyses)).toBe(true);
	});

	test("agent timeline returns data with _meta", async ({ request }) => {
		const res = await request.get(`/api/agent/timeline?sessionId=${SESSION_ID}`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.data).toBeDefined();
		expect(data._meta).toBeDefined();
	});

	test("agent failures returns data with _meta", async ({ request }) => {
		const res = await request.get(`/api/agent/failures?sessionId=${SESSION_ID}`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.data).toBeDefined();
		expect(data._meta).toBeDefined();
	});

	test("agent improvements returns data with _meta", async ({ request }) => {
		const res = await request.get(`/api/agent/improvements?sessionId=${SESSION_ID}`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.data).toBeDefined();
		expect(data._meta).toBeDefined();
	});
});
