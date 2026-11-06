import { test, expect, type CategoryData, type CategoryCustomizableLinkData } from "../../src";

for (const entity of ["Category", "Product", "Landing page"] as const) {
    test(`English ${entity} link parameters select the localized administration controls`, async ({
        ShopAdmin,
        IdProvider,
        AdminCategories,
        AdminApiContext,
        CreateLinkTypeCategory,
        TestDataService,
    }) => {
        const parent = await TestDataService.createCategory(
            {
                name: `00_parent_${IdProvider.getIdPair().id}`,
                active: true,
            },
            ""
        );
        const target = entity === "Product" ? await TestDataService.createBasicProduct() : entity === "Landing page" ? await TestDataService.createLandingPage() : parent;
        const category: CategoryData = {
            name: `00_link_${IdProvider.getIdPair().id}`,
            categoryType: "Link",
            status: true,
        };
        const link: CategoryCustomizableLinkData = {
            linkType: "Internal",
            entity,
            category: parent.name,
            product: target.name,
            landingPage: target.name,
            openInNewTab: true,
        };

        await ShopAdmin.goesTo(AdminCategories.url());
        await ShopAdmin.attemptsTo(CreateLinkTypeCategory(category, link, parent.name));

        const response = await AdminApiContext.post("search/category", {
            data: { filter: [{ type: "equals", field: "name", value: category.name }] },
        });
        expect(response.ok()).toBeTruthy();
        const { data: savedCategories } = await response.json();
        expect(savedCategories).toHaveLength(1);
        expect(savedCategories[0]).toMatchObject({
            name: category.name,
            active: true,
            type: "link",
            linkType: { Category: "category", Product: "product", "Landing page": "landing_page" }[entity],
            internalLink: target.id,
            linkNewTab: true,
        });
    });
}
