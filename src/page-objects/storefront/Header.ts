import type { Page, Locator } from "playwright-core";
import type { PageObject } from "../../types/PageObject";
import { translate } from "../../services/LanguageHelper";

export class Header implements PageObject {
    public readonly mainNavigationLink: Locator;
    public readonly topBarNav: Locator;
    public readonly languagesDropdown: Locator;
    public readonly languagesMenuOptions: Locator;
    public readonly currenciesDropdown: Locator;
    public readonly currenciesMenuOptions: Locator;
    public readonly searchInput: Locator;

    //skip links
    public readonly skipToMainContentLink: Locator;

    //wishlist
    public readonly wishlistIcon: Locator;
    public readonly wishlistBasket: Locator;
    public readonly page: Page;

    //cart
    public readonly cartTotal: Locator;
    public readonly cartButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.mainNavigationLink = page.locator(".main-navigation-link-text");
        this.topBarNav = page.getByRole("navigation", { name: translate("storefront:header:topBarNav") });
        this.languagesDropdown = this.topBarNav.locator(".top-bar-language").getByRole("button", { name: translate("storefront:header:languageDropdown") });
        this.languagesMenuOptions = this.topBarNav.locator(".top-bar-language").getByRole("list");
        this.currenciesDropdown = page.locator(".sw-currency-select > button[data-bs-toggle=dropdown]");
        this.currenciesMenuOptions = page.locator(".sw-currency-select__form");
        this.searchInput = page.getByLabel(translate("storefront:header:searchInputAriaLabel"));

        //skip links
        this.skipToMainContentLink = page.getByRole("link", { name: translate("storefront:header:skipToContentLink"), exact: true });

        //wishlist
        this.wishlistIcon = page.getByRole("link", { name: translate("storefront:header:wishlistIcon") });
        this.wishlistBasket = page.locator(".header-wishlist-badge");

        //cart
        this.cartTotal = page.getByRole("link", { name: translate("storefront:header:shoppingCart") });
        this.cartButton = page
            .locator('header.sw-header button.sw-cart-widget[data-component="Sw:Header:CartWidget"]')
            .and(page.getByRole("button", { name: translate("storefront:header:shoppingCart"), exact: true }))
            .or(
                page
                    .locator('header.header-main .header-cart a.header-cart-btn[data-cart-widget="true"]')
                    .and(page.getByRole("link", { name: translate("storefront:header:shoppingCart") }))
            );
    }

    url() {
        // Header is part of other pages and does not have a url, but the class needs a url method.
        throw new Error("Header does not have an own url.");
        return "";
    }
}
