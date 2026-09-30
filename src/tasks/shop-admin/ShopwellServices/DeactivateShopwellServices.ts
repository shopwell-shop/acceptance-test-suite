import { test as base, expect } from "@playwright/test";
import type { Task } from "../../../types/Task";
import type { FixtureTypes } from "../../../types/FixtureTypes";

export const DeactivateShopwellServices = base.extend<{ DeactivateShopwellServices: Task }, FixtureTypes>({
    DeactivateShopwellServices: async ({ ShopAdmin, AdminShopwellServices }, use) => {
        const task = () => {
            return async function DeactivateShopwellServices() {
                if (AdminShopwellServices.url() != "#/sw/settings/services/index") {
                    await ShopAdmin.goesTo(AdminShopwellServices.url());
                }
                await AdminShopwellServices.deactivateServicesButton.click();
                await ShopAdmin.expects(AdminShopwellServices.deactivateServicesModal).toBeVisible();
                const disableResponsePromise = AdminShopwellServices.page.waitForResponse(`${process.env["APP_URL"]}api/services/disable`);
                await AdminShopwellServices.deactivateServicesConfirmButton.click();
                const disableResponse = await disableResponsePromise;
                expect(disableResponse.ok()).toBeTruthy();
                await ShopAdmin.expects(AdminShopwellServices.deactivatedBanner).toBeVisible({ timeout: 15000 });
            };
        };
        await use(task);
    },
});
