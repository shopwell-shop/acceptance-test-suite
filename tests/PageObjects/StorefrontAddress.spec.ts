import { test, expect, getCountryAddressData } from "../../src";

test("Customers can create and edit a postal address through the public page objects", async ({
    ShopCustomer,
    TestDataService,
    IdProvider,
    Login,
    AddNewAddress,
    StorefrontAccountAddresses,
    StorefrontAccountAddressDetails,
    DefaultSalesChannel,
}) => {
    const customer = await TestDataService.createCustomer();
    const defaults = getCountryAddressData();
    const address = {
        name: `Address ${IdProvider.getIdPair().id}`,
        company: "Address Company",
        department: "Operations",
        street: defaults.street,
        zipcode: defaults.postalCode,
        city: defaults.city,
        country: defaults.country,
    };

    await ShopCustomer.attemptsTo(Login(customer));
    await ShopCustomer.goesTo(StorefrontAccountAddresses.url());
    await ShopCustomer.attemptsTo(AddNewAddress(address));

    const savedAddress = await StorefrontAccountAddresses.getAvailableAddress(address);
    await ShopCustomer.expects(savedAddress.address).toContainText(address.street);
    for (const field of ["name", "street", "zipcode", "city"] as const) {
        const mismatch = await StorefrontAccountAddresses.getAvailableAddress({ ...address, [field]: `${address[field]} missing` });
        await ShopCustomer.expects(mismatch.address).toHaveCount(0);
    }
    await ShopCustomer.presses(savedAddress.addressActions);
    await ShopCustomer.presses(savedAddress.useAsDefaultBillingButton);
    await ShopCustomer.expects(await StorefrontAccountAddresses.getDefaultBillingAddress(address)).toBeVisible();
    await ShopCustomer.presses(savedAddress.addressActions);
    await ShopCustomer.presses(savedAddress.useAsDefaultShippingButton);
    await ShopCustomer.expects(await StorefrontAccountAddresses.getDefaultShippingAddress(address)).toBeVisible();
    await ShopCustomer.presses(savedAddress.addressActions);
    await ShopCustomer.presses(savedAddress.editAddressButton);

    const addressId = new URL(StorefrontAccountAddressDetails.page.url()).pathname.split("/").pop()!;
    TestDataService.addCreatedRecord("customer_address", addressId);
    const createdAddress = await TestDataService.getCustomerAddress(addressId);
    expect(createdAddress).toMatchObject({
        name: address.name,
        street: address.street,
        zipcode: address.zipcode,
        city: address.city,
        company: address.company,
        department: address.department,
        countryId: DefaultSalesChannel.salesChannel.countryId,
    });

    const editedStreet = `${address.street} 2`;
    await ShopCustomer.fillsIn(StorefrontAccountAddressDetails.streetInput, editedStreet);
    await ShopCustomer.presses(StorefrontAccountAddressDetails.saveAddressButton);
    const editedCard = await StorefrontAccountAddresses.getAvailableAddress({ ...address, street: editedStreet });
    await ShopCustomer.expects(editedCard.address).toContainText(editedStreet);

    const editedAddress = await TestDataService.getCustomerAddress(addressId);
    expect(editedAddress).toMatchObject({
        name: address.name,
        street: editedStreet,
        zipcode: address.zipcode,
        city: address.city,
        countryId: DefaultSalesChannel.salesChannel.countryId,
    });
});
