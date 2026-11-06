import { test, expect } from "../../src";

test("Administration page objects - Customer.", async ({ ShopAdmin, AdminCustomerListing, AdminCustomerDetail, TestDataService }) => {
    const customer = await TestDataService.createCustomer();

    await ShopAdmin.goesTo(AdminCustomerListing.url());
    await ShopAdmin.expects(AdminCustomerListing.headline).toBeVisible();
    await ShopAdmin.expects(AdminCustomerListing.addCustomerButton).toBeVisible();
    const customerRow = await AdminCustomerListing.getCustomerByEmail(customer.email);
    await ShopAdmin.expects(customerRow.customerEmailAddress).toHaveText(customer.email);

    await ShopAdmin.goesTo(AdminCustomerDetail.url(customer.id));
    await ShopAdmin.expects(AdminCustomerDetail.generalTab).toBeVisible();
    await ShopAdmin.expects(AdminCustomerDetail.accountCard).toBeVisible({ timeout: 15_000 });
    await ShopAdmin.expects(AdminCustomerDetail.customerEmail).toBeVisible();
});

test("BulkEditCustomers selects a configured customer group beyond the first result page", async ({
    ShopAdmin,
    AdminCustomerListing,
    AdminApiContext,
    IdProvider,
    TestDataService,
    BulkEditCustomers,
}, testInfo) => {
    for (let index = 0; index < 26; index++) {
        await TestDataService.createCustomerGroup({
            id: `00000000${IdProvider.getIdPair().uuid.slice(8)}`,
            name: `pagination-filler-${IdProvider.getIdPair().id}`,
        });
    }
    const group = await TestDataService.createCustomerGroup({
        id: `ffffffff${IdProvider.getIdPair().uuid.slice(8)}`,
        name: `pagination-target-${IdProvider.getIdPair().id}`,
    });
    const firstPageQuery = { page: 1, limit: 25, term: "", "total-count-mode": 0 };
    const initialResponse = await AdminApiContext.post("search/customer-group", { data: firstPageQuery });
    expect(initialResponse.ok()).toBeTruthy();
    const initialGroups = (await initialResponse.json()).data;
    expect(initialGroups).toHaveLength(25);
    expect(initialGroups.map((entry: { id: string }) => entry.id)).not.toContain(group.id);
    await testInfo.attach("customer-group-first-page", {
        body: JSON.stringify({ query: firstPageQuery, targetId: group.id, initialIds: initialGroups.map((entry: { id: string }) => entry.id) }),
        contentType: "application/json",
    });

    const customers = [await TestDataService.createCustomer(), await TestDataService.createCustomer()];
    await ShopAdmin.goesTo(AdminCustomerListing.url());
    await ShopAdmin.attemptsTo(BulkEditCustomers(customers, { customerGroup: group.name }));

    for (const customer of customers) {
        const savedResponse = await AdminApiContext.get(`customer/${customer.id}`);
        expect(savedResponse.ok()).toBeTruthy();
        expect((await savedResponse.json()).data.groupId).toBe(group.id);
    }
});
