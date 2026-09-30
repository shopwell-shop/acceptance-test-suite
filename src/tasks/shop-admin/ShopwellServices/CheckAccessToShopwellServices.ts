import { expect, test as base } from "@playwright/test";
import type { Task } from "../../../types/Task";
import type { FixtureTypes } from "../../../types/FixtureTypes";
import type { AclRole, User } from "../../../types/ShopwellTypes";
import { createNewAdminPageContext, loginToAdministration } from "../../../services/AdminLoginHelper";
import { translate } from "../../../services/LanguageHelper";

export const CheckAccessToShopwellServices = base.extend<{ CheckAccessToShopwellServices: Task }, FixtureTypes>({
    CheckAccessToShopwellServices: async ({ TestDataService, SalesChannelBaseConfig, browser }, use) => {
        const task = (customUser?: User, aclRole?: AclRole) => {
            return async function CheckAccessToShopwellServices() {
                let user;

                if (customUser === undefined) {
                    user = await TestDataService.createUser();
                } else {
                    user = await TestDataService.getUserById(customUser.id);
                    user.password = customUser.password;
                }

                const adminPage = await loginToAdministration(await createNewAdminPageContext(browser, SalesChannelBaseConfig), user, TestDataService.AdminApiClient);

                const shopwellServicesAdvertisementBanner = adminPage.locator(".sw-settings-services-dashboard-banner__content").first();
                const shopwellServicesExploreNowButton = shopwellServicesAdvertisementBanner.getByRole("button", {
                    name: translate("administration:shopwellServices:buttons.exploreNow"),
                });

                await expect(shopwellServicesAdvertisementBanner).toBeVisible();
                await expect(shopwellServicesExploreNowButton).toBeVisible();
                await expect(shopwellServicesAdvertisementBanner).toContainText(translate("administration:shopwellServices:dashboard.shopwellServicesIntroduction"));
                await shopwellServicesExploreNowButton.click();

                const adminPrivilegeHeader = adminPage.getByRole("heading", { name: translate("administration:shopwellServices:messages.accessDenied") }).first();
                const shopwellServicesHeader = adminPage.getByRole("heading", { name: translate("administration:shopwellServices:headings.futureProofStore") });

                if (!aclRole?.privileges.includes("system:plugin:maintain")) {
                    await expect(adminPrivilegeHeader).toBeVisible();
                } else {
                    await expect(adminPrivilegeHeader).toBeHidden();
                    await expect(shopwellServicesHeader).toBeVisible();
                }
            };
        };
        await use(task);
    },
});
