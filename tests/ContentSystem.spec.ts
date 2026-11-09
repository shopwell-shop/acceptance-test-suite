import { createServer } from "node:http";
import { once } from "node:events";
import { test, expect, request } from "@playwright/test";
import { TestDataService } from "../src/services/TestDataService";
import { AdminApiContext } from "../src/services/AdminApiContext";
import { IdProvider } from "../src/services/IdProvider";
import type { SalesChannel } from "../src/types/ShopwellTypes";

test("Content Layout public helpers create real layouts, reassign by scope and clean assignments before layouts", async () => {
    const layouts = new Map<string, Record<string, unknown>>();
    const assignments = new Map<string, Record<string, unknown>>();
    const deleted: string[] = [];
    const server = createServer(async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
        const route = (req.url ?? "").split("?")[0];
        const reply = (status: number, data: unknown) => {
            res.writeHead(status, { "content-type": "application/json" });
            res.end(JSON.stringify(data));
        };
        if (req.method === "POST" && route === "/content-layout") {
            if (!body.id || !body.name || body.version !== "1.0.0" || body.rootSource !== "landing_page" || !Array.isArray(body.layout) || "type" in body || "sections" in body) {
                reply(400, { error: "Invalid Content Layout fields" });
                return;
            }
            layouts.set(body.id, body);
            reply(200, { data: body });
        } else if (route === "/search/landing-page-content-layout") {
            const records = [...assignments.values()].filter((assignment) =>
                body.filter.every((filter: { type: string; field: string; value: unknown }) =>
                    filter.type === "equalsAny" ? (filter.value as unknown[]).includes(assignment[filter.field]) : assignment[filter.field] === filter.value
                )
            );
            reply(200, { data: records });
        } else if (route === "/search/category-content-layout" || route === "/search/product-content-layout") {
            reply(200, { data: [] });
        } else if (route === "/landing-page-content-layout" || route?.startsWith("/landing-page-content-layout/")) {
            const id = route.split("/")[2] ?? body.id;
            const assignment = { ...assignments.get(id), ...body, id };
            if (!layouts.has(assignment.contentLayoutId as string)) {
                reply(400, { error: "Missing layout" });
                return;
            }
            assignments.set(id, assignment);
            reply(200, { data: assignment });
        } else if (route === "/_action/sync") {
            for (const operation of Object.values(body) as { entity: string; payload: { id: string }[] }[]) {
                if (
                    operation.entity === "content_layout" &&
                    operation.payload.some(({ id }) => [...assignments.values()].some((assignment) => assignment.contentLayoutId === id))
                ) {
                    reply(409, { error: "Content Layout is still assigned" });
                    return;
                }
            }
            for (const operation of Object.values(body) as { entity: string; payload: { id: string }[] }[]) {
                const records = operation.entity === "content_layout" ? layouts : assignments;
                operation.payload.forEach(({ id }) => records.delete(id));
                deleted.push(operation.entity);
            }
            reply(200, { deleted: {}, notFound: [] });
        } else if (route === "/_action/cache" || route === "/_action/cache-delayed") {
            reply(200, {});
        } else {
            reply(404, { error: "Unsupported resource", route });
        }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server port");
    const baseURL = `http://127.0.0.1:${address.port}/`;
    const context = await request.newContext({ baseURL });
    const api = new AdminApiContext(context, {
        app_url: baseURL,
        client_id: "test",
        client_secret: "test",
        access_token: "test",
        admin_username: "test",
        admin_password: "test",
        ignoreHTTPSErrors: false,
        authMaxRetries: 1,
        authBaseDelayMs: 0,
    });
    const service = new TestDataService(api, new IdProvider(0, "content-layout-contract"), {
        defaultSalesChannel: { id: "1".repeat(32) } as SalesChannel,
        defaultTaxId: "",
        defaultCurrencyId: "",
        defaultCategoryId: "",
        defaultLanguageId: "",
        defaultCountryId: "",
        defaultCustomerGroupId: "",
    });
    try {
        const first = await service.createBasicPageLayout("landing_page", { name: "First landing layout" });
        expect(first).toMatchObject({ name: "First landing layout", rootSource: "landing_page", version: "1.0.0" });
        expect(first).not.toHaveProperty("type");
        expect(first).not.toHaveProperty("sections");
        expect(first.layout).toEqual([expect.objectContaining({ component: "Sw:Content:Text", properties: { text: "<h1>{{map:landing_page.name}}</h1>" } })]);
        const second = await service.createBasicPageLayout("landing_page", {
            name: "Replacement layout",
            layout: [{ id: "2".repeat(32), component: "Sw:Content:Text", properties: { text: "<h1>Replacement</h1>" } }],
        });
        const landingPageId = "3".repeat(32);
        const initial = await service.assignLandingPageLayout(landingPageId, first.id);
        const reassigned = await service.assignLandingPageLayout(landingPageId, second.id);
        expect(reassigned.id).toBe(initial.id);
        expect(reassigned.contentLayoutId).toBe(second.id);
        const channelAssignment = await service.assignLandingPageLayout(landingPageId, first.id, "4".repeat(32));
        expect(channelAssignment.id).not.toBe(initial.id);
        expect(assignments.size).toBe(2);
        await service.cleanUp();
        expect(assignments.size).toBe(0);
        expect(layouts.size).toBe(0);
        expect(deleted.indexOf("landing_page_content_layout")).toBeLessThan(deleted.indexOf("content_layout"));
    } finally {
        await context.dispose();
        server.close();
        await once(server, "close");
    }
});
