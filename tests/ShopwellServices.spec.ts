import { test, expect, translate } from "../src";
import { satisfies } from "compare-versions";

test("Shopwell Services", async ({ InstanceMeta, ShopAdmin, AdminDashboard, AdminShopwellServices }) => {
    if (satisfies(InstanceMeta.version, ">=6.7.1 <6.7.14.0") && !InstanceMeta.isSaaS) {
        await ShopAdmin.expects(AdminDashboard.shopwellServicesAdvertisementBanner).toBeVisible();
        await ShopAdmin.expects(AdminDashboard.shopwellServicesAdvertisementBanner).toContainText(
            translate("administration:shopwellServices:dashboard.shopwellServicesIntroduction")
        );
        await ShopAdmin.expects(AdminDashboard.shopwellServicesExploreNowButton).toBeVisible();

        await ShopAdmin.goesTo(AdminShopwellServices.url());
        await ShopAdmin.expects(AdminShopwellServices.header).toBeVisible();
        try {
            await ShopAdmin.expects(AdminShopwellServices.deactivateServicesButton).toBeVisible();
        } catch {
            await AdminShopwellServices.activateServicesButton.click();
        }

        await AdminShopwellServices.deactivateServicesButton.click();
        await ShopAdmin.expects(AdminShopwellServices.deactivateServicesModal).toBeVisible();
        await ShopAdmin.expects(AdminShopwellServices.deactivateServicesConfirmButton).toBeVisible();
        const disableResponsePromise = AdminShopwellServices.page.waitForResponse(`${process.env["APP_URL"]}api/services/disable`);
        await AdminShopwellServices.deactivateServicesConfirmButton.click();
        const disableResponse = await disableResponsePromise;
        expect(disableResponse.ok()).toBeTruthy();
        // enable the services again for further tests
        await ShopAdmin.expects(AdminShopwellServices.activateServicesButton).toBeVisible({ timeout: 15000 });
        const enableResponsePromise = AdminShopwellServices.page.waitForResponse(`${process.env["APP_URL"]}api/services/enable`);
        await AdminShopwellServices.activateServicesButton.click();
        const enableResponse = await enableResponsePromise;
        expect(enableResponse.ok()).toBeTruthy();
        await AdminShopwellServices.page.reload();
        await ShopAdmin.expects(AdminShopwellServices.deactivateServicesButton).toBeVisible({ timeout: 15000 });
    }
});
