import { satisfies } from "compare-versions";
import { test, expect, translate } from "../../src";

test("Administration page objects - General.", async ({
    InstanceMeta,
    AdminApiContext,
    ShopAdmin,
    AdminDashboard,
    AdminCategories,
    AdminLandingPageCreate,
    TestDataService,
    AdminOrderDetail,
    AdminProductDetail,
    AdminMedia,
    AdminOrderListing,
}) => {
    const category = await TestDataService.createCategory();
    await ShopAdmin.goesTo(AdminCategories.url());
    await ShopAdmin.expects(AdminCategories.landingPageHeadline).toBeVisible();
    await ShopAdmin.expects(AdminCategories.getTreeItemContextButton(category.name)).toBeVisible();

    await ShopAdmin.goesTo(AdminLandingPageCreate.url());
    await ShopAdmin.expects(AdminLandingPageCreate.nameInput).toBeVisible();
    await ShopAdmin.expects(AdminLandingPageCreate.saveLandingPageButton).toBeVisible();

    const product = await TestDataService.createBasicProduct();
    const customer = await TestDataService.createCustomer();
    const order = await TestDataService.createOrder([{ product, quantity: 1 }], customer);

    await ShopAdmin.goesTo(AdminOrderListing.url());
    await ShopAdmin.expects(AdminOrderListing.addOrderButton).toBeVisible();
    await AdminOrderListing.listSettingsButton.click();
    await AdminOrderListing.deliveryAddressColumnCheckbox.check();
    await AdminOrderListing.listSettingsButton.click();

    const orderLineItemRow = await AdminOrderListing.getLineItemByOrderNumber(order.orderNumber);
    await ShopAdmin.expects(orderLineItemRow.orderNumberText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderCustomerNameText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderDeliveryAddressText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderTotalAmountText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderStateText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderPaymentStateText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderDeliveryStateText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderDateText).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderCheckbox).toBeVisible();
    await ShopAdmin.expects(orderLineItemRow.orderContextButton).toBeVisible();

    const orderRequest = satisfies(InstanceMeta.version, ">=6.7.15")
        ? AdminOrderDetail.page.waitForRequest((request) => new URL(request.url()).pathname.endsWith("/search/order") && request.method() === "POST")
        : null;
    await ShopAdmin.goesTo(AdminOrderDetail.url(order.id));
    await ShopAdmin.expects(AdminOrderDetail.saveButton).toBeVisible();
    await ShopAdmin.expects(AdminOrderDetail.dataGridContextButton).toBeVisible();
    await ShopAdmin.expects(AdminOrderDetail.itemsCardHeader).toContainText(translate("administration:order:detail.items"));

    await ShopAdmin.expects(AdminOrderDetail.orderState).toBeVisible();
    await ShopAdmin.expects(AdminOrderDetail.orderPaymentStatus).toBeVisible();
    await ShopAdmin.expects(AdminOrderDetail.orderDeliveryStatus).toBeVisible();

    if (orderRequest) {
        const contentLanguageId = (await orderRequest).headers()["sw-language-id"];
        expect(contentLanguageId).toBeTruthy();
        const machineNames = ["order.state", "order_transaction.state", "order_delivery.state"];
        const statesResponse = await AdminApiContext.post("search/state-machine-state", {
            headers: { "sw-language-id": contentLanguageId },
            data: {
                filter: [
                    { type: "equals", field: "technicalName", value: "open" },
                    { type: "equalsAny", field: "stateMachine.technicalName", value: machineNames },
                ],
                associations: { stateMachine: {} },
            },
        });
        expect(statesResponse.ok()).toBeTruthy();
        const states = (await statesResponse.json()).data as { technicalName: string; translated: { name: string }; stateMachine: { technicalName: string } }[];
        expect(states.map((state) => state.stateMachine.technicalName).sort()).toEqual([...machineNames].sort());
        for (const state of states) {
            expect(state.technicalName).toBe("open");
            expect(state.translated.name).toMatch(/\S/);
        }
        const names = new Map(states.map((state) => [state.stateMachine.technicalName, state.translated.name]));
        await ShopAdmin.expects(AdminOrderDetail.orderStateInput).toHaveValue(names.get("order.state")!);
        await ShopAdmin.expects(AdminOrderDetail.orderPaymentStatusInput).toHaveValue(names.get("order_transaction.state")!);
        await ShopAdmin.expects(AdminOrderDetail.orderDeliveryStatusInput).toHaveValue(names.get("order_delivery.state")!);
    }

    await ShopAdmin.goesTo(AdminProductDetail.url(product.id));
    await ShopAdmin.expects(AdminProductDetail.savePhysicalProductButton).toBeVisible();
    await ShopAdmin.expects(AdminProductDetail.stockInput).toBeVisible();

    await ShopAdmin.goesTo(AdminDashboard.url());
    if (!InstanceMeta.isSaaS) {
        await ShopAdmin.expects(AdminDashboard.dashboardContent).toBeVisible();
    }

    await ShopAdmin.goesTo(AdminMedia.url());
    await ShopAdmin.expects(AdminMedia.uploadFileButton).toBeVisible();
    await ShopAdmin.expects(AdminMedia.searchInput).toBeVisible();
    await ShopAdmin.expects(AdminMedia.addNewFolderButton).toBeVisible();

    if (await AdminDashboard.adminMenuOffCanvasToggle.isVisible()) {
        AdminDashboard.adminMenuOffCanvasToggle.click();
    }

    await ShopAdmin.expects(AdminDashboard.adminMenuUserActions).toBeVisible();
    await AdminDashboard.adminMenuUserActions.click();
    await ShopAdmin.expects(AdminDashboard.adminMenuLogoutButton).toBeVisible();
});
