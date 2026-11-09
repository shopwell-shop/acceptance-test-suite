import { test as componentTest } from "@playwright/test";
import { Search } from "../../src/page-objects/storefront/Search";
import { satisfies } from "compare-versions";
import { test, expect, formatPrice } from "../../src";

test("Storefront page objects", async ({
    ShopCustomer,
    AddProductToCart,
    StorefrontProductDetail,
    Login,
    ConfirmTermsAndConditions,
    SubmitOrder,
    StorefrontCheckoutCart,
    StorefrontCheckoutConfirm,
    StorefrontCheckoutFinish,
    StorefrontAccount,
    StorefrontAccountLogin,
    StorefrontAccountProfile,
    StorefrontAccountOrder,
    StorefrontAccountAddresses,
    StorefrontAccountPayment,
    StorefrontCategory,
    StorefrontSearch,
    TestDataService,
    InstanceMeta,
    CheckVisibilityInHome,
    StorefrontHeader,
}) => {
    const category = await TestDataService.createCategory();
    const product = await TestDataService.createBasicProduct();
    await TestDataService.assignProductCategory(product.id, category.id);

    await ShopCustomer.goesTo(`${StorefrontCategory.url(category.name)}?a=${Date.now()}`);

    await ShopCustomer.attemptsTo(CheckVisibilityInHome(product.name));
    await ShopCustomer.expects(StorefrontCategory.sortingSelect).toBeVisible();

    await ShopCustomer.expects(StorefrontHeader.cartTotal).toBeVisible();

    const searchTerm = "product";
    await ShopCustomer.goesTo(StorefrontSearch.url(searchTerm));
    await ShopCustomer.expects(StorefrontSearch.headline).toBeVisible();

    await ShopCustomer.goesTo(StorefrontAccountLogin.url());
    await ShopCustomer.expects(StorefrontAccountLogin.loginButton).toBeVisible();
    await ShopCustomer.attemptsTo(Login());

    await ShopCustomer.goesTo(StorefrontProductDetail.url(product));
    await ShopCustomer.expects(StorefrontProductDetail.addToCartButton).toBeVisible();
    await ShopCustomer.attemptsTo(AddProductToCart(product));

    await ShopCustomer.goesTo(StorefrontCheckoutCart.url());
    await ShopCustomer.expects(StorefrontCheckoutCart.grandTotalPrice).toBeVisible();

    await ShopCustomer.goesTo(StorefrontCheckoutConfirm.url());
    await ShopCustomer.expects(StorefrontCheckoutConfirm.termsAndConditionsCheckbox).toBeVisible();

    await ShopCustomer.attemptsTo(ConfirmTermsAndConditions());
    await ShopCustomer.attemptsTo(SubmitOrder());
    const orderId = StorefrontCheckoutFinish.getOrderId();
    TestDataService.addCreatedRecord("order", orderId);
    await ShopCustomer.expects(StorefrontCheckoutFinish.headline).toBeVisible();

    await ShopCustomer.goesTo(StorefrontAccount.url());
    await ShopCustomer.expects(StorefrontAccount.headline).toBeVisible();

    await ShopCustomer.goesTo(StorefrontAccountOrder.url());
    await ShopCustomer.expects(StorefrontAccountOrder.orderExpandButton).toBeVisible();

    await ShopCustomer.goesTo(StorefrontAccountProfile.url());
    await ShopCustomer.expects(StorefrontAccountProfile.changeEmailButton).toBeVisible();

    await ShopCustomer.goesTo(StorefrontAccountAddresses.url());
    await ShopCustomer.expects(StorefrontAccountAddresses.addNewAddressButton).toBeVisible();

    if (satisfies(InstanceMeta.version, "<6.7")) {
        await ShopCustomer.goesTo(StorefrontAccountPayment.url());
        await ShopCustomer.expects(StorefrontAccountPayment.changeDefaultPaymentButton).toBeVisible();
    }
});

test("Component contract: listing cards retain names, prices and links", async ({ ShopCustomer, StorefrontHome, TestDataService }) => {
    const product = await TestDataService.createBasicProduct();
    await TestDataService.clearCaches();
    await ShopCustomer.goesTo(StorefrontHome.url());
    const item = await StorefrontHome.getListingItemByProductName(product.name);
    await expect(item.productName).toHaveText(product.name);
    await expect(item.productName).toHaveAttribute("href", /.+/);
    await expect(item.productPrice).toContainText(formatPrice(10));
    await expect(StorefrontHome.productListItems.filter({ hasText: product.name })).toHaveCount(1);
    await expect(StorefrontHome.productItemNames).toContainText([product.name]);
});

test("Component contract: the main price excludes cards and the tier locator contains the whole table", async ({
    ShopCustomer,
    StorefrontHome,
    StorefrontProductDetail,
    TestDataService,
    Translate,
}) => {
    const product = await TestDataService.createProductWithPriceRange();
    await TestDataService.clearCaches();
    await ShopCustomer.goesTo(StorefrontHome.url());
    const renderedCard = await ShopCustomer.page
        .locator(".sw-product-card")
        .filter({ hasText: product.name })
        .evaluate((element) => element.outerHTML);
    await ShopCustomer.goesTo(StorefrontProductDetail.url(product));
    await ShopCustomer.page.getByRole("main").evaluate((element, card) => element.insertAdjacentHTML("beforeend", card), renderedCard);
    await expect(StorefrontProductDetail.productSinglePrice).toHaveCount(1);
    await expect(StorefrontProductDetail.productSinglePrice).toContainText(formatPrice(70));
    await expect(StorefrontProductDetail.productPriceRangesRow).toHaveCount(1);
    await expect(StorefrontProductDetail.productPriceRangesRow.getByRole("columnheader")).toHaveText([
        Translate("storefront:product:pricing.quantity"),
        Translate("storefront:product:pricing.unitPrice"),
    ]);
    await expect(StorefrontProductDetail.productPriceRangesRow.getByRole("rowheader")).toHaveText([
        `${Translate("storefront:product:pricing.to")} 10`,
        `${Translate("storefront:product:pricing.to")} 20`,
        `${Translate("storefront:product:pricing.to")} 50`,
        `${Translate("storefront:product:pricing.from")} 51`,
    ]);
    await expect(StorefrontProductDetail.productPriceRangesRow.getByRole("cell")).toHaveText([100, 90, 80, 70].map((price) => formatPrice(price)));
});

test("Component contract: the unchanged currency task submits both real currency options", async ({
    ShopCustomer,
    StorefrontHeader,
    ChangeStorefrontCurrency,
    TestDataService,
    DefaultSalesChannel,
    StorefrontHome,
}) => {
    const currency = await TestDataService.createCurrency({
        translations: { [DefaultSalesChannel.salesChannel.languageId]: { name: "Contract currency", shortName: "Contract" } },
    });
    await TestDataService.assignSalesChannelCurrency(DefaultSalesChannel.salesChannel.id, currency.id);
    await TestDataService.clearCaches();
    await ShopCustomer.goesTo(StorefrontHome.url());
    const names = await ShopCustomer.page.locator(".sw-currency-select__form button[name=currencyId]").evaluateAll((buttons) =>
        buttons.map((button) =>
            Array.from(button.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent)
                .join("")
                .trim()
        )
    );
    expect(names.length).toBeGreaterThanOrEqual(2);
    expect(names.every((name) => name.length > 0)).toBe(true);
    for (const name of names.slice(0, 2)) {
        await ShopCustomer.attemptsTo(ChangeStorefrontCurrency(name));
        await expect(StorefrontHeader.currenciesDropdown).toContainText(name);
    }
});

test("Component contract: submitted GET search retains zero, one and two results with digit-bearing terms", async ({
    ShopCustomer,
    SearchForTerm,
    StorefrontSearchSuggest,
    StorefrontSearch,
    StorefrontHome,
    TestDataService,
}) => {
    const term = `ComponentContract${Date.now()}42`;
    await ShopCustomer.page
        .locator("body")
        .evaluate((body) =>
            body.insertAdjacentHTML(
                "beforeend",
                '<header class="header-main"><form class="header-search-form"><input class="header-search-input" aria-label="Other page header search"></form></header>'
            )
        );
    await expect(StorefrontSearchSuggest.searchInput).toHaveCount(1);
    await expect(StorefrontSearchSuggest.searchInput).toHaveClass(/sw-search__input/);
    await ShopCustomer.attemptsTo(SearchForTerm(term));
    await expect(ShopCustomer.page).toHaveURL((url) => url.pathname.endsWith("/search") && url.searchParams.get("search") === term);
    await expect(StorefrontSearch.headline).toContainText(term);
    expect(await StorefrontSearch.getTotalSearchResultCount()).toBe(0);
    await expect(StorefrontSearch.productListItems).toHaveCount(0);
    await ShopCustomer.page.locator("body").evaluate((body) => body.insertAdjacentHTML("beforeend", '<input class="header-search-input" aria-label="Unrelated header search">'));
    await expect(StorefrontSearchSuggest.searchInput).toHaveCount(1);
    await expect(StorefrontSearchSuggest.searchInput).toHaveClass(/header-search-input/);
    const first = await TestDataService.createBasicProduct({ name: `${term} first` });
    await TestDataService.clearCaches();
    await ShopCustomer.attemptsTo(SearchForTerm(term));
    expect(await StorefrontSearch.getTotalSearchResultCount()).toBe(1);
    await expect(StorefrontSearch.productItemNames).toHaveText([first.name]);
    const legacyItem = await StorefrontHome.getListingItemByProductName(first.name);
    await expect(legacyItem.productName).toHaveText(first.name);
    await expect(legacyItem.productPrice).toContainText(formatPrice(10));
    await expect(legacyItem.productName).toHaveAttribute("href", /.+/);
    const second = await TestDataService.createBasicProduct({ name: `${term} second` });
    await TestDataService.clearCaches();
    await ShopCustomer.attemptsTo(SearchForTerm(term));
    expect(await StorefrontSearch.getTotalSearchResultCount()).toBe(2);
    await expect(StorefrontSearch.productListItems).toHaveCount(2);
    expect((await StorefrontSearch.productItemNames.allTextContents()).map((name) => name.trim()).sort()).toEqual([first.name, second.name].sort());
});

for (const [label, liveText, total] of [
    ["English singular", "Showing 1 products.", 1],
    ["English pagination", "Showing 24 out of 125 products.", 125],
    ["Chinese pagination", "显示 24/125 件商品", 125],
] as const) {
    componentTest(`Component contract: result total uses ${label} live text rather than the digit-bearing headline or page length`, async ({ page }) => {
        await page.setContent(
            `<div class="search-page"><h1 class="search-headline">One product for Contract42</h1><div class="product-listing-row" data-aria-live-text="${liveText}"><div class="product-box"><a class="product-name">Contract42</a></div></div></div>`
        );
        const search = new Search(page);
        expect(await search.getTotalSearchResultCount()).toBe(total);
        await expect(search.productListItems).toHaveCount(1);
        await expect(search.productItemNames).toHaveText(["Contract42"]);
    });
}

componentTest("Component contract: missing result total fails explicitly", async ({ page }) => {
    await page.setContent(
        '<div class="search-page"><h1 class="search-headline">42 products for Contract99</h1><div class="product-listing-row" data-aria-live-text="No numeric count"></div></div>'
    );
    await expect(new Search(page).getTotalSearchResultCount()).rejects.toThrow(/count/i);
});
