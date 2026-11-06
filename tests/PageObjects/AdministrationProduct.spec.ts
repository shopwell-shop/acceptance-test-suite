import { test, expect } from "../../src";

test("SaveProduct uses the localized save contract and persists the changed name", async ({ ShopAdmin, AdminProductDetail, AdminApiContext, SaveProduct, TestDataService }) => {
    const product = await TestDataService.createBasicProduct();
    const updatedName = `${product.name} updated`;
    await ShopAdmin.goesTo(AdminProductDetail.url(product.id));
    await AdminProductDetail.nameInput.fill(updatedName);
    await ShopAdmin.attemptsTo(SaveProduct());
    const response = await AdminApiContext.get(`product/${product.id}`);
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).data.name).toBe(updatedName);
});

test("English bulk methods update the selected products through localized controls", async ({
    ShopAdmin,
    AdminProductListing,
    AdminApiContext,
    BulkEditProducts,
    TestDataService,
    DefaultSalesChannel,
    IdProvider,
}) => {
    const originalTag = await TestDataService.createTag(`original-${IdProvider.getIdPair().id}`);
    const addedTag = await TestDataService.createTag(`added-${IdProvider.getIdPair().id}`);
    const products = await Promise.all(
        Array.from({ length: 3 }, () =>
            TestDataService.createBasicProduct({
                stock: 200,
                restockTime: 10,
                tags: [{ id: originalTag.id }],
                visibilities: [{ salesChannelId: DefaultSalesChannel.salesChannel.id, visibility: 30 }],
            })
        )
    );
    await ShopAdmin.goesTo(AdminProductListing.url(products.map((product) => product.name)));
    await ShopAdmin.attemptsTo(
        BulkEditProducts(products.slice(0, 2), {
            stock: { value: "400", method: "Overwrite" },
            restockTime: { value: "", method: "Clear" },
            tags: { value: addedTag.name, method: "Add" },
            saleschannel: { value: DefaultSalesChannel.salesChannel.name, method: "Remove" },
        })
    );
    for (const [index, product] of products.entries()) {
        const response = await AdminApiContext.post("search/product", {
            data: {
                ids: [product.id],
                associations: { tags: {}, visibilities: {} },
            },
        });
        expect(response.ok()).toBeTruthy();
        const saved = (await response.json()).data[0];
        const changed = index < 2;
        expect(saved.stock).toBe(changed ? 400 : 200);
        expect(saved.restockTime).toBe(changed ? null : 10);
        expect(saved.tags.map((tag: { id: string }) => tag.id).sort()).toEqual((changed ? [originalTag.id, addedTag.id] : [originalTag.id]).sort());
        expect(saved.visibilities.map((visibility: { salesChannelId: string }) => visibility.salesChannelId)).toEqual(changed ? [] : [DefaultSalesChannel.salesChannel.id]);
    }
});
