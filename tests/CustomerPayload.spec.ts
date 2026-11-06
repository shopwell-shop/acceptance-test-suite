import { createServer } from "node:http";
import { test, expect } from "@playwright/test";
import { AdminApiContext } from "../src/services/AdminApiContext";
import { IdProvider } from "../src/services/IdProvider";
import { TestDataService } from "../src/services/TestDataService";

for (const gender of [undefined, "female"]) {
    test(`Customer creation uses name and optional gender (${gender ?? "unset"}) without a dictionary lookup`, async ({ playwright }) => {
        const requests: { path: string; payload: Record<string, unknown> }[] = [];
        const server = createServer(async (request, response) => {
            let body = "";
            for await (const chunk of request) body += chunk;
            const payload = JSON.parse(body) as Record<string, unknown>;
            requests.push({ path: request.url ?? "", payload });
            response.setHeader("Content-Type", "application/json");
            if (request.url !== "/customer?_response=detail") {
                response.writeHead(404).end(JSON.stringify({ errors: [{ detail: "Unknown entity" }] }));
                return;
            }
            response.end(JSON.stringify({ data: payload }));
        });
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        if (!address || typeof address === "string") throw new Error("Missing API test server address");
        const appUrl = `http://127.0.0.1:${address.port}/`;
        const context = await playwright.request.newContext({ baseURL: appUrl });
        try {
            const api = new AdminApiContext(context, {
                app_url: appUrl,
                client_id: "",
                client_secret: "",
                access_token: "",
                admin_username: "",
                admin_password: "",
                ignoreHTTPSErrors: false,
                authMaxRetries: 0,
                authBaseDelayMs: 0,
            });
            const ids = new IdProvider(0, "customer-contract");
            const salesChannel = { id: ids.getIdPair().uuid };
            const service = new TestDataService(api, ids, {
                defaultSalesChannel: salesChannel,
                defaultTaxId: ids.getIdPair().uuid,
                defaultCurrencyId: ids.getIdPair().uuid,
                defaultCategoryId: ids.getIdPair().uuid,
                defaultLanguageId: ids.getIdPair().uuid,
                defaultCountryId: ids.getIdPair().uuid,
                defaultCustomerGroupId: ids.getIdPair().uuid,
            });
            const customer = await service.createCustomer({ name: "Contract Customer", ...(gender ? { gender } : {}) });
            expect(customer.name).toBe("Contract Customer");
            expect(customer.gender).toBe(gender);
            expect(requests).toHaveLength(1);
            expect(requests[0].payload).not.toHaveProperty("salutationId");
            for (const key of ["defaultBillingAddress", "defaultShippingAddress"]) {
                expect(requests[0].payload[key]).toEqual(expect.objectContaining({ name: expect.any(String) }));
                expect(requests[0].payload[key]).not.toHaveProperty("salutationId");
                expect(requests[0].payload[key]).not.toHaveProperty("gender");
            }
        } finally {
            await context.dispose();
            await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
        }
    });
}
