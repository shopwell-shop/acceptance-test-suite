import { test, expect, type Customer, type CustomerAddress, type Order } from "../src";

test("Customer fixtures use name and optional gender without salutation lookups", async ({ TestDataService, AdminApiContext, DefaultSalesChannel }) => {
    expect(DefaultSalesChannel.customer.name).toBeTruthy();
    expect(DefaultSalesChannel.customer).not.toHaveProperty("salutationId");

    const customer = await TestDataService.createCustomer({ name: "Contract Customer", gender: "female" });
    const response = await AdminApiContext.get(`customer/${customer.id}`);
    expect(response.ok()).toBeTruthy();
    const { data: savedCustomer } = (await response.json()) as { data: Customer };
    expect(savedCustomer.name).toBe("Contract Customer");
    expect(savedCustomer.gender).toBe("female");
    expect(savedCustomer).not.toHaveProperty("salutationId");

    const address = await TestDataService.createCustomerAddress(customer, { name: "Delivery Recipient" });
    const addressResponse = await AdminApiContext.get(`customer-address/${address.id}`);
    expect(addressResponse.ok()).toBeTruthy();
    const { data: savedAddress } = (await addressResponse.json()) as { data: CustomerAddress };
    expect(savedAddress.name).toBe("Delivery Recipient");
    expect(savedAddress).toHaveProperty("gender", "not_specified");
    expect(savedAddress).not.toHaveProperty("salutationId");

    const product = await TestDataService.createBasicProduct();
    const order = await TestDataService.createOrder([{ product, quantity: 1 }], customer);
    const orderResponse = await AdminApiContext.post("search/order", {
        data: {
            filter: [{ type: "equals", field: "id", value: order.id }],
            associations: { orderCustomer: {}, deliveries: { associations: { shippingOrderAddress: {} } } },
        },
    });
    expect(orderResponse.ok()).toBeTruthy();
    const { data: orders } = (await orderResponse.json()) as { data: Order[] };
    const savedOrder = orders[0];
    expect(savedOrder.orderCustomer?.name).toBe("Contract Customer");
    expect(savedOrder.orderCustomer).not.toHaveProperty("salutationId");
    expect(savedOrder.deliveries?.[0].shippingOrderAddress?.name).toBeTruthy();
    expect(savedOrder.deliveries?.[0].shippingOrderAddress).not.toHaveProperty("salutationId");
});

for (const path of ["account/login", "account/register"]) {
    test(`Account registration collects credentials on ${path}`, async ({ ShopCustomer, StorefrontAccountLogin, Register, TestDataService, IdProvider }) => {
        await ShopCustomer.goesTo(path);
        await expect(StorefrontAccountLogin.nameInput).toHaveCount(0);
        await expect(StorefrontAccountLogin.genderSelect).toHaveCount(0);
        await expect(StorefrontAccountLogin.billingAddressFormArea).toHaveCount(0);
        const email = `register_${IdProvider.getIdPair().id}@example.com`;
        await ShopCustomer.attemptsTo(Register({ email }));
        const customer = await TestDataService.getCustomerByEmail(email);
        expect(customer?.email).toBe(email);
        expect(customer).not.toHaveProperty("salutationId");
    });
}
